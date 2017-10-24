import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { AppState } from '../../app.store';
import { SongFile } from '../../models/song-file';
import { getPlayerCurrentFile, getPlayerBusy } from '../../reducers';
import { UpdateFileList, LoadRandomFile, DeleteFile } from '../../actions/player';

@Component({
  templateUrl: './player.component.html'
})
export class PlayerComponent implements OnInit {

  readonly currentFile$: Observable<SongFile | undefined>;
  readonly busy$: Observable<boolean>;

  constructor(private readonly store: Store<AppState>, hotkeysService: HotkeysService) {
    this.currentFile$ = store.select(getPlayerCurrentFile);
    this.busy$ = store.select(getPlayerBusy);
    hotkeysService.add(new Hotkey('ctrl+right', () => { this.next(); return false; }));
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
