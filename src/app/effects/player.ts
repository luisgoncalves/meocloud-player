import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/withLatestFrom';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/defer';

import { FileManagerService } from '../services/file-manager.service';
import { CloudClientService } from '../services/cloud-client.service';
import { PersistenceService } from '../services/persistence.service';

import * as p from '../actions/player';
import { AppState } from '../app.store';

@Injectable()
export class PlayerEffects {

  @Effect({ dispatch: false })
  openDatabase$ = Observable.defer(() => this.fileManager.openDatabase());

  @Effect()
  loadFile = this.actions$
    .ofType<p.LoadRandomFile>(p.LoadRandomFile.type)
    .withLatestFrom(this.store)
    .map(([_, state]) => state.player.files)
    .map(files => files[Math.floor(Math.random() * files.length)])
    .switchMap(file => this.cloudClient
      .getFileUrl(file.path)
      .map(fileUrl => new p.LoadRandomFileSuccess({ ...file, url: fileUrl.url }))
    );

  @Effect()
  updateFileList = this.actions$
    .ofType<p.UpdateFileList>(p.UpdateFileList.type)
    .switchMap(() => this.cloudClient
      .delta(this.persistence.lastCursor)
      .switchMap(delta => this.fileManager.processUpdate(delta))
      // Store the last known cursor (this helps if something fails in large deltas)
      .do(delta => this.persistence.setLastCursor(delta.cursor))
      .last()
    )
    .switchMap(() => this.fileManager.getFiles())
    .map(files => new p.UpdateFileListSuccess(files));

  @Effect()
  deleteFile = this.actions$
    .ofType<p.DeleteFile>(p.DeleteFile.type)
    .switchMap(a => this.cloudClient
      .deleteFile(a.payload.path)
      .map(() => new p.DeleteFileSuccess(a.payload))
    );

  @Effect()
  deleteFileSuccess = this.actions$
    .ofType(p.UpdateFileListSuccess.type, p.DeleteFileSuccess.type)
    .map(() => new p.LoadRandomFile());

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>,
    private readonly fileManager: FileManagerService,
    private readonly cloudClient: CloudClientService,
    private readonly persistence: PersistenceService) { }
}
