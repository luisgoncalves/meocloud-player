import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  authzUrl: string;

  constructor(
    public readonly cloud: CloudConfiguration,
    route: ActivatedRoute,
    router: Router,
    store: Store<AppState>) {

    this.hasToken$ = store.select(hasCloudAccessToken);

    // OAuth callbacks are delivered on the root; route accordingly if needed.
    if (route.snapshot.fragment) {
      router.navigate(['/oauth/callback'], { preserveFragment: true });
    }
  }
}
