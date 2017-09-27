import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StoreModule, INITIAL_STATE } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { PlayerComponent } from './components/player/player.component';
import { OAuthComponent } from './components/oauth/oauth.component';

import { CloudClientService } from './services/cloud-client.service';
import { OAuth2ImplicitFlowService } from './services/oauth2-implicit.service';
import { PersistenceService } from './services/persistence.service';
import { WindowRef } from './services/window-ref';

import { environment } from '../environments/environment';
import { CloudConfiguration, clouds } from './models/cloud-config';
import { reducers } from './reducers';
import { CloudEffects } from './effects/cloud';
import { AppState } from './app.store';

const cloudConfig = clouds[environment.cloudName](environment.clientId);

const appRoutes: Routes = [
  { path: 'player', component: PlayerComponent },
  { path: 'oauth/:mode', component: OAuthComponent },
  { path: '', component: HomeComponent },
];

function getInitialState(persistence: PersistenceService): AppState {
  return {
    cloud: { accessToken: persistence.accessToken },
    player: {}
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlayerComponent,
    OAuthComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([CloudEffects])
  ],
  providers: [
    { provide: CloudConfiguration, useValue: cloudConfig },
    { provide: INITIAL_STATE, useFactory: getInitialState, deps: [PersistenceService] },
    CloudClientService,
    OAuth2ImplicitFlowService,
    PersistenceService,
    WindowRef,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
