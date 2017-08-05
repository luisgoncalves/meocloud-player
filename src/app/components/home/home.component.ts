import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { CloudConfiguration } from '../../models/cloud-config';
import { AppState } from '../../app.store';
import { hasCloudAccessToken } from '../../reducers';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  hasToken$: Observable<boolean>;

  constructor(public readonly cloud: CloudConfiguration, store: Store<AppState>) {
    this.hasToken$ = store.select(hasCloudAccessToken);
  }
}
