import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SongFile } from '../../models/song-file';

@Component({
  selector: 'current-file',
  templateUrl: './current-file.component.html'
})
export class CurrentFileComponent {

  @Input()
  file: SongFile;
  @Input()
  busy: boolean;
  @Output()
  delete = new EventEmitter<SongFile>();
  @Output()
  next = new EventEmitter<any>();

  onNext() { this.next.emit(); }
  onDelete() { this.delete.emit(this.file); }
}
