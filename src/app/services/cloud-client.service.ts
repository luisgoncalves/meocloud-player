import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/concat';

import * as URI from 'urijs';
import 'urijs/src/URITemplate';

import { CloudConfiguration } from '../models/cloud-config';
import { AppState } from '../app.store';
import { getCloudAccessToken } from '../reducers';

export class FileUrl {
    url: string;
    expires: string;
}

export class FileMetadata {
    isDirectory: boolean;
    path: string;
    mimeType: string;
}

export class Delta {
    updatedItems: FileMetadata[];
    deletedPaths: string[];
    cursor: string;
}

class DeltaEndpointResponse {
    has_more: boolean;
    cursor: string;
    entries: any[];
}

@Injectable()
export class CloudClientService {
    private readonly mediaUrlTemplate: string;
    private readonly deleteFileUrl: string;
    private readonly deltaUrl: string;
    private headers: HttpHeaders;

    constructor(
        private readonly http: HttpClient,
        private readonly cloud: CloudConfiguration,
        store: Store<AppState>) {

        const adjustApiPath = cloud.adjustApiPath || function (p) { return p; };

        this.mediaUrlTemplate = cloud.apiBaseAddress + adjustApiPath('/Media/') + cloud.root + '{+path}';
        this.deleteFileUrl = cloud.apiBaseAddress + adjustApiPath('/Fileops/Delete');
        this.deltaUrl = cloud.apiBaseAddress + adjustApiPath('/Delta');

        store
            .select(getCloudAccessToken)
            .subscribe(accessToken => this.headers = new HttpHeaders().set('Authorization', 'Bearer ' + accessToken));
    }

    getFileUrl(path: string): Observable<FileUrl> {
        return this.http.post<FileUrl>(
            URI.expand(this.mediaUrlTemplate, { path }).valueOf(),
            undefined,
            { headers: this.headers });
    }

    deleteFile(path: string) {
        return this.http.post(
            this.deleteFileUrl,
            { path, root: this.cloud.root },
            { headers: this.headers });
    }

    delta(cursor: string | null): Observable<Delta> {
        return this.http
            .post<DeltaEndpointResponse>(this.deltaUrl, { cursor }, { headers: this.headers })
            .map(this.processDeltaResponse)
            .switchMap(([delta, hasMore]) => {
                window.console.log('DELTA %s', cursor);
                let res = Observable.of(delta);
                if (hasMore) {
                    res = res.concat(this.delta(delta.cursor));
                }
                return res;
            });
    }

    private processDeltaResponse(deltaResponse: DeltaEndpointResponse): [Delta, boolean] {
        const updatedItems: FileMetadata[] = [];
        const deletedPaths: string[] = [];

        deltaResponse.entries.forEach(entry => {
            // entry => [path, metadata]
            const item = entry[1];
            if (item !== null) {
                updatedItems.push({
                    path: entry[0], // Easier for later comparisons (casing is diferent on 'path' and on 'metadata.path')
                    isDirectory: item.is_dir,
                    mimeType: item.mime_type
                });
            } else {
                deletedPaths.push(entry[0]);
            }
        });

        return [
            { updatedItems, deletedPaths, cursor: deltaResponse.cursor },
            deltaResponse.has_more
        ];
    }
}
