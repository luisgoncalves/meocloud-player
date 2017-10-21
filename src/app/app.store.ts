import { SongFile } from './models/song-file';

export interface AppState {
  cloud: CloudState;
  player: PlayerState;
}

export interface CloudState {
  accessToken: string | null;
}

export interface PlayerState {
  currentFile?: SongFile;
  files: SongFile[];
  busy: boolean;
}
