import { Directive, HostListener, EventEmitter, Output } from '@angular/core';
import { WindowRef } from '../services/window-ref';

@Directive({ selector: '[confirmClick]' })
export class ConfirmClickDirective {

  @Output()
  confirmClick = new EventEmitter<any>();

  constructor(private readonly window: WindowRef) { }

  @HostListener('click') onClick() {
    if (this.window.nativeWindow.confirm('Are you sure?')) {
      this.confirmClick.emit();
      return true;
    }
    return false;
  }
}
