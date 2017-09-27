import { Injectable } from '@angular/core';
import { WindowRef } from './window-ref';
import { CloudConfiguration } from '../models/cloud-config';

@Injectable()
export class PersistenceService {

  private readonly storage: Storage;
  private readonly accessTokenKey: string;

  constructor(window: WindowRef, cloud: CloudConfiguration) {
    this.storage = window.nativeWindow.localStorage;
    this.accessTokenKey = cloud.name + '_oauth_token';
  }

  get accessToken(): string | undefined {
    return this.storage.getItem(this.accessTokenKey) || undefined;
  }

  setAccessToken(accessToken: string) {
    this.storage.setItem(this.accessTokenKey, accessToken);
  }
}
