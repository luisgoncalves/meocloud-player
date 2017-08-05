import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StoreModule, INITIAL_STATE } from '@ngrx/store';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { PlayerComponent } from './components/player/player.component';
import { OAuthComponent } from './components/oauth/oauth.component';

import { CloudClientService } from './services/cloud-client.service';

import { environment } from '../environments/environment';
import { CloudConfiguration, clouds } from './models/cloud-config';
import { reducers } from './reducers';
import { AppState } from './app.store';

const cloudConfig = clouds[environment.cloudName](environment.clientId);

const appRoutes: Routes = [
  { path: 'player', component: PlayerComponent },
  { path: 'oauth/:mode', component: OAuthComponent },
  { path: '', component: HomeComponent },
];

const initialState: AppState = {
  cloud: { accessToken: undefined},
  player: {}
};

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
    StoreModule.forRoot(reducers)
  ],
  providers: [
    { provide: CloudConfiguration, useValue: cloudConfig },
    { provide: INITIAL_STATE, useValue: initialState },
    CloudClientService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
