import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { StoreModule, INITIAL_STATE } from '@ngrx/store';
import { EffectsModule, Effect, Actions } from '@ngrx/effects';
import { HotkeyModule } from 'angular2-hotkeys';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { PlayerComponent } from './components/player/player.component';
import { OAuthComponent } from './components/oauth/oauth.component';

import { CloudClientService } from './services/cloud-client.service';
import { OAuth2ImplicitFlowService } from './services/oauth2-implicit.service';
import { FileManagerService } from './services/file-manager.service';
import { PersistenceService } from './services/persistence.service';
import { WindowRef } from './services/window-ref';
import { HasTokenGuard } from './services/token-guard.service';
import { FormUrlEncodedInterceptor } from './services/form-url-encoded.interceptor';

import { environment } from '../environments/environment';
import { CloudConfiguration, clouds } from './models/cloud-config';
import { reducers } from './reducers';
import { CloudEffects } from './effects/cloud';
import { PlayerEffects } from './effects/player';
import { AppState } from './app.store';
import { CurrentFileComponent } from './components/player/current-file.component';
import { ConfirmClickDirective } from './directives/confirm-click.directive';

const cloudConfig = clouds[environment.cloudName](environment.clientId);

const appRoutes: Routes = [
  { path: 'player', component: PlayerComponent, canActivate: [HasTokenGuard] },
  { path: 'oauth/:mode', component: OAuthComponent },
  { path: '', component: HomeComponent },
];

export function getInitialState(persistence: PersistenceService): AppState {
  return {
    cloud: { accessToken: persistence.accessToken },
    player: { files: [], busy: false },
  };
}

@Injectable()
export class LogEffects {

  @Effect({ dispatch: false })
  log = this.actions$.do(console.log);

  constructor(private readonly actions$: Actions) { }
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlayerComponent,
    CurrentFileComponent,
    OAuthComponent,
    ConfirmClickDirective
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    HttpClientModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([LogEffects, CloudEffects, PlayerEffects]),
    HotkeyModule.forRoot()
  ],
  providers: [
    { provide: CloudConfiguration, useValue: cloudConfig },
    { provide: INITIAL_STATE, useFactory: getInitialState, deps: [PersistenceService] },
    CloudClientService,
    OAuth2ImplicitFlowService,
    FileManagerService,
    PersistenceService,
    WindowRef,
    HasTokenGuard,
    { provide: HTTP_INTERCEPTORS, useClass: FormUrlEncodedInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
