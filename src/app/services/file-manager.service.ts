import { Injectable } from '@angular/core';
import { Delta } from './cloud-client.service';
import { WindowRef } from './window-ref';

import { CloudConfiguration } from '../models/cloud-config';

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
    return Promise.resolve(delta);
  }
}
