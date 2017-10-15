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

import { LoadRandomFile, LoadRandomFileSuccess, UpdateFileList, UpdateFileListSuccess } from '../actions/player';
import { SongFile } from '../models/song-file';
import { AppState } from '../app.store';

@Injectable()
export class PlayerEffects {

  private static readonly files: SongFile[] = [
    { url: 'http://www.noiseaddicts.com/samples_1w72b820/4927.mp3' },
    { url: 'http://www.noiseaddicts.com/samples_1w72b820/293.mp3' },
    { url: 'http://www.noiseaddicts.com/samples_1w72b820/4936.mp3' }
  ];

  @Effect({ dispatch: false })
  openDatabase$ = Observable.defer(() => this.fileManager.openDatabase());

  @Effect()
  loadFile = this.actions$
    .ofType<LoadRandomFile>(LoadRandomFile.type)
    .withLatestFrom(this.store)
    .map(([_, state]) => state.player.files)
    .map(files => new LoadRandomFileSuccess(files[Math.floor(Math.random() * files.length)]));

  @Effect()
  updateFileList = this.actions$
    .ofType<UpdateFileList>(UpdateFileList.type)
    .withLatestFrom(this.store)
    .switchMap(([_, state]) => {
      return this.cloudClient.delta(state.cloud.cursor)
        .take(4) // TEMP
        .switchMap(delta => this.fileManager.processUpdate(delta))
        .last()
        .map(() => new UpdateFileListSuccess(PlayerEffects.files));
      // return Observable.timer(2000).map(__ => new UpdateFileListSuccess(PlayerEffects.files));
    });

  // @Effect()
  // updateFileListSuccess = this.actions$
  //   .ofType<UpdateFileListSuccess>(UpdateFileListSuccess.type);
  // .map(_ => new LoadRandomFile());

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<AppState>,
    private readonly fileManager: FileManagerService,
    private readonly cloudClient: CloudClientService) { }
}
