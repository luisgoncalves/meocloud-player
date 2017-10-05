import { PlayerState } from '../app.store';
import * as p from '../actions/player';

export function reducer(state: PlayerState, action: p.Actions): PlayerState {

  switch (action.type) {

    case p.LoadRandomFile.type:
      // TODO set 'loading' status
      return state;

    case p.LoadRandomFileSuccess.type:
      return {
        ...state,
        currentFile: action.payload
      };

    case p.UpdateFileList.type:
      // TODO set 'loading' status
      return state;

    case p.UpdateFileListSuccess.type:
      return {
        ...state,
        files: action.payload
      };
  }

  return state;
}

export const getCurrentFile = (state: PlayerState) => state.currentFile;
