import { Action } from '@ngrx/store';
import { SongFile } from '../models/song-file';

export class LoadRandomFile implements Action {
    static readonly type = 'PLAYER__LOAD_RANDOM_FILE';
    readonly type = LoadRandomFile.type;
    constructor() { }
}

export class LoadRandomFileSuccess implements Action {
    static readonly type = 'PLAYER__LOAD_RANDOM_FILE_SUCCESS';
    readonly type = LoadRandomFileSuccess.type;
    constructor(public readonly payload: SongFile) { }
}

export class DeleteFile implements Action {
    static readonly type = 'PLAYER__DELETE_FILE';
    readonly type = DeleteFile.type;
    constructor(public readonly payload: SongFile) { }
}

export class DeleteFileSuccess implements Action {
    static readonly type = 'PLAYER__DELETE_FILE_SUCCESS';
    readonly type = DeleteFileSuccess.type;
    constructor(public readonly payload: SongFile) { }
}

export class UpdateFileList implements Action {
    static readonly type = 'PLAYER__UPDATE_FILES';
    readonly type = UpdateFileList.type;
}

export class UpdateFileListSuccess implements Action {
    static readonly type = 'PLAYER__UPDATE_FILES_SUCCESS';
    readonly type = UpdateFileListSuccess.type;
    constructor(public readonly payload: SongFile[]) { }
}

export type Actions = LoadRandomFile |
    LoadRandomFileSuccess |
    DeleteFile |
    DeleteFileSuccess |
    UpdateFileList |
    UpdateFileListSuccess;
