import { Injectable } from '@angular/core';
import { Delta, FileMetadata } from './cloud-client.service';
import { WindowRef } from './window-ref';

import { CloudConfiguration } from '../models/cloud-config';
import { SongFile } from '../models/song-file';

@Injectable()
export class FileManagerService {

  private static readonly FilesStoreName = 'files';

  private readonly window: Window;
  private readonly dbFactory: IDBFactory;
  private database: IDBDatabase;

  constructor(window: WindowRef, private readonly cloud: CloudConfiguration) {
    this.window = window.nativeWindow;
    this.dbFactory = window.nativeWindow.indexedDB;
  }

  openDatabase(): Promise<any> {

    return new Promise((resolve, _) => {

      const request = this.dbFactory.open(this.cloud.name);

      request.onsuccess = (event: any) => {
        // Store the db object
        this.database = event.target.result;
        // Generic error handler
        this.database.onerror = (errorEvent: any) => {
          this.window.console.error('Database error: %s', errorEvent.target.errorCode);
        };
        this.window.console.info('Database opened');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        // This is invoked before the 'onsuccess' event, if any changes are needed
        const db = event.target.result;
        this.window.console.log('Creating files object store');
        db.createObjectStore(FileManagerService.FilesStoreName, { keyPath: 'path' });
      };

    });
  }

  processUpdate(delta: Delta): Promise<Delta> {
    return new Promise((resolve, reject) => {

      const transaction = this.database.transaction(FileManagerService.FilesStoreName, 'readwrite');
      // DB requests will be triggered on this transaction. When it completes, all the requests have succeeded.
      transaction.oncomplete = () => resolve(delta);
      transaction.onerror = (event) => reject(event);

      const fileStore = transaction.objectStore(FileManagerService.FilesStoreName);

      if (delta.deletedPaths.length > 0) {
        this.purgeFiles(delta.deletedPaths, fileStore);
      }

      delta.updatedItems.forEach(item => {
        if (item.isDirectory) {
          this.removeFileIfExists(item, fileStore);
        } else {
          this.addFile(item, fileStore);
        }
      });
    });
  }

  private purgeFiles(deletedPaths: string[], fileStore: IDBObjectStore) {
    // Iterate the existing files and remove the deleted paths and all their children
    fileStore.openCursor().onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        // Check if the current file is a child of the deleted paths (or one of them)
        if (deletedPaths.some(p => cursor.key.startsWith(p))) {
          cursor.delete().onsuccess = () => {
            this.window.console.info('REMOVED %s', cursor.key);
            cursor.continue();
          };
        } else {
          cursor.continue();
        }
      }
    };
  }

  private removeFileIfExists(item: FileMetadata, fileStore: IDBObjectStore) {
    fileStore
      .get(item.path)
      .onsuccess = (event: any) => {
        // Was indeed a file. Remove it.
        if (event.target.result) {
          fileStore
            .delete(item.path)
            .onsuccess = () => this.window.console.info('REMOVED %s', item.path);
        }
      };
  }

  private addFile(item: FileMetadata, fileStore: IDBObjectStore) {
    if (item.mimeType.startsWith('audio/mpeg') || item.mimeType === 'audio/wav' || item.path.endsWith('.mp3')) {
      fileStore
        .put({ path: item.path, tags: null })
        .onsuccess = () => this.window.console.info('ADDED %s', item.path);
    } else {
      this.window.console.log('IGNORED %s due to mime-type %s', item.path, item.mimeType);
    }
  }

  getFiles(): Promise<SongFile[]> {
    return new Promise((resolve, reject) => {
      const fileStore = <any>this.database
        .transaction(FileManagerService.FilesStoreName, 'readonly')
        .objectStore(FileManagerService.FilesStoreName);
      const request = <IDBRequest>fileStore.getAll();
      request.onsuccess = () => resolve(request.result.map((f: any) => ({ path: f.path, url: '' })));
      request.onerror = event => reject(event);
    });
  }
}
