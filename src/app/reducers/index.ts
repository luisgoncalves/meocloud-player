import { createSelector } from '@ngrx/store';
import { AppState } from '../app.store';
import * as cloud from './cloud';
import * as player from './player';

export const reducers = {
  cloud: cloud.reducer,
  player: player.reducer
};

export const getCloudAccessToken = createSelector(
  (state: AppState) => state.cloud,
  cloud.getAccessToken
);

export const hasCloudAccessToken = createSelector(
  getCloudAccessToken,
  token => token ? true : false
);
