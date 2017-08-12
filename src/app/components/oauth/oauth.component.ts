import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OAuth2ImplicitFlowService } from '../../services/oauth2-implicit.service';
import { WindowRef } from '../../services/window-ref';

const MODE_AUTHORIZE = 'authorize';
const MODE_CALLBACK = 'callback';

@Component({
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss']
})
export class OAuthComponent {

  constructor(route: ActivatedRoute, oAuthService: OAuth2ImplicitFlowService, window: WindowRef) {
    const routeSnapshot = route.snapshot;

    switch (routeSnapshot.paramMap.get('mode')) {
      case MODE_AUTHORIZE:
        window.nativeWindow.location.href = oAuthService.prepareAuthzRequest();
        break;
      case MODE_CALLBACK:
        const res = oAuthService.processAuthzResponse(routeSnapshot.fragment);
        console.log(res);
        break;
      default:
        throw { message: 'Unknown OAuth mode' };
    }
  }
}
