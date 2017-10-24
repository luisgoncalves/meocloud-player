import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../app.store';
import { hasCloudAccessToken } from '../reducers/index';

@Injectable()
export class HasTokenGuard implements CanActivate {

  constructor(private readonly store: Store<AppState>, private readonly router: Router) { }

  canActivate() {
    return this.store
      .select(hasCloudAccessToken)
      .map(has => {
        if (!has) {
          this.router.navigate(['/oauth', 'authorize']);
        }
        return has;
      });
  }
}
