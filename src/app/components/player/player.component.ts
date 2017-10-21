import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { AppState } from '../../app.store';
import { SongFile } from '../../models/song-file';
import { getPlayerCurrentFile } from '../../reducers';
import { UpdateFileList, LoadRandomFile, DeleteFile } from '../../actions/player';

@Component({
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {

  readonly currentFile$: Observable<SongFile | undefined>;

  constructor(private readonly store: Store<AppState>) {
    this.currentFile$ = store.select(getPlayerCurrentFile);
  }

  ngOnInit() {
    this.store.dispatch(new UpdateFileList());
  }

  next(): void {
    this.store.dispatch(new LoadRandomFile());
  }

  delete(file: SongFile): void {
    this.store.dispatch(new DeleteFile(file));
  }
}
