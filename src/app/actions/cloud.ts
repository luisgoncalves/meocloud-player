import { Action } from '@ngrx/store';

export class AccessTokenObtained implements Action {
  static readonly type = 'CLOUD__ACCESS_TOKEN_OBTAINED';
  readonly type = AccessTokenObtained.type;
  constructor(public readonly payload: string) { }
}

export type Actions = AccessTokenObtained;
