import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { CloudConfiguration, clouds } from './cloud-config';
import { HomeComponent } from './components/home/home.component';
import { PlayerComponent } from './components/player/player.component';
import { OAuthComponent } from './components/oauth/oauth.component';

const cloudConfig = clouds[environment.cloudName](environment.clientId);

const appRoutes: Routes = [
  { path: 'player', component: PlayerComponent },
  { path: 'oauth/:mode', component: OAuthComponent },
  { path: '', component: HomeComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlayerComponent,
    OAuthComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    { provide: CloudConfiguration, useValue: cloudConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
