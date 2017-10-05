import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as Uri from 'urijs';

import { CloudConfiguration } from '../../models/cloud-config';
import { AppState } from '../../app.store';
import { hasCloudAccessToken } from '../../reducers';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  hasToken$: Observable<boolean>;

  constructor(
    public readonly cloud: CloudConfiguration,
    route: ActivatedRoute,
    router: Router,
    store: Store<AppState>) {

    this.hasToken$ = store.select(hasCloudAccessToken);

    const routeSnapshot = route.snapshot;

    // OAuth callbacks are delivered on the root; route accordingly if needed.
    if (routeSnapshot.fragment) {
      router.navigate(['/oauth/callback'], { preserveFragment: true });
    }

    // MEO Cloud has a bug and doesn't return errors on the URL fragment. Assume this
    // is a bogus OAuth callback if it has query string.
    if (routeSnapshot.queryParams.error) {
      const fragment = Uri.buildQuery(routeSnapshot.queryParams);
      router.navigate(['/oauth/callback'], { fragment });
    }
  }
}
