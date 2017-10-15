import { Injectable } from '@angular/core';
import { WindowRef } from './window-ref';
import { CloudConfiguration } from '../models/cloud-config';

@Injectable()
export class PersistenceService {

  private readonly storage: Storage;
  private readonly accessTokenKey: string;
  private readonly lastCursorKey: string;

  constructor(window: WindowRef, cloud: CloudConfiguration) {
    this.storage = window.nativeWindow.localStorage;
    this.accessTokenKey = cloud.name + '_oauth_token';
    this.lastCursorKey = cloud.name + '_last_cursor';
  }

  get accessToken(): string | null {
    return this.storage.getItem(this.accessTokenKey);
  }

  setAccessToken(accessToken: string) {
    this.storage.setItem(this.accessTokenKey, accessToken);
  }

  get lastCursor(): string | null {
    return this.storage.getItem(this.lastCursorKey);
  }

  setLastCursor(cursor: string) {
    this.storage.setItem(this.lastCursorKey, cursor);
  }
}
