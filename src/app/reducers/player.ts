import { PlayerState } from '../app.store';
import * as p from '../actions/player';

export function reducer(state: PlayerState, action: p.Actions): PlayerState {

  switch (action.type) {

    case p.LoadRandomFile.type:
      return {
        ...state,
        busy: true
      };

    case p.LoadRandomFileSuccess.type:
      return {
        ...state,
        currentFile: action.payload,
        busy: false
      };

    case p.UpdateFileList.type:
      return {
        ...state,
        busy: true
      };

    case p.UpdateFileListSuccess.type:
      return {
        ...state,
        files: action.payload,
        busy: false
      };

    case p.DeleteFile.type:
      return {
        ...state,
        busy: true
      };

    case p.DeleteFileSuccess.type:
      return {
        ...state,
        files: state.files.filter(f => f !== action.payload),
        busy: false
      };
  }

  return state;
}

export const getCurrentFile = (state: PlayerState) => state.currentFile;
