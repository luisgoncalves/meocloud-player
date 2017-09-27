import { Action } from '@ngrx/store';

const prefix = 'CLOUD__';

export class AccessTokenObtained implements Action {
  static readonly type = `${prefix}ACCESS_TOKEN_OBTAINED`;
  readonly type = AccessTokenObtained.type;
  constructor(public payload: string) { }
}

export type Actions = AccessTokenObtained;
