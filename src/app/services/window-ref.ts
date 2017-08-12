import { Injectable } from '@angular/core';

function _window(): any {
   // Global native browser window object
   return window;
}

@Injectable()
export class WindowRef {
   get nativeWindow(): any {
      return _window();
   }
}
