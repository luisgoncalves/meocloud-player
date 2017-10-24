import { CloudState } from '../app.store';
import * as c from '../actions/cloud';

export function reducer(state: CloudState = { accessToken: null }, action: c.Actions): CloudState {

  switch (action.type) {
    case c.AccessTokenObtained.type:
      return {
        ...state,
        accessToken: action.payload
      };
  }

  return state;
}

export const getAccessToken = (state: CloudState) => state.accessToken;
