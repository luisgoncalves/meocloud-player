import 'rxjs/add/operator/do';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { AccessTokenObtained } from '../actions/cloud';
import { PersistenceService } from '../services/persistence.service';

@Injectable()
export class CloudEffects {

  @Effect({ dispatch: false })
  storeAccessToken = this.actions$
    .ofType<AccessTokenObtained>(AccessTokenObtained.type)
    .do(action => {
      this.persistence.setAccessToken(action.payload);
    });

  constructor(
    private readonly actions$: Actions,
    private readonly persistence: PersistenceService) { }
}
