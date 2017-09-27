import { CloudState } from '../app.store';
import { Actions, AccessTokenObtained } from '../actions/cloud';

export function reducer(state: CloudState = {}, action: Actions): CloudState {
  if (action instanceof AccessTokenObtained) {
    return {
      ...state,
      accessToken: action.payload
    };
  }
  return state;
}

export const getAccessToken = (state: CloudState) => state.accessToken;
