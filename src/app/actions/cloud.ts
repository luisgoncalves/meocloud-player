import { Action } from '@ngrx/store';

const prefix = 'CLOUD__';

export class AccessTokenObtainedAction implements Action {
  readonly type = `${prefix}ACCESS_TOKEN_OBTAINED`;
  constructor(public payload: string) { }
}

export type Actions = AccessTokenObtainedAction;
