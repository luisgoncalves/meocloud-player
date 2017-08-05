import { SongFile } from './models/song-file';

export interface AppState {
  cloud: CloudState;
  player: PlayerState;
}

export interface CloudState {
  accessToken?: string;
  cursor?: string;
}

export interface PlayerState {
  currentFile?: SongFile;
}
