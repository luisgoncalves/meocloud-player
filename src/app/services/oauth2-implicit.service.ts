import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

import base64url from 'base64url';
import * as UriTemplate from 'uri-templates';
import { URITemplate } from 'uri-templates';
import * as Uri from 'urijs';
import { CloudConfiguration } from '../models/cloud-config';
import { WindowRef } from './window-ref';

export class AuthorizationSuccessResponse {
    constructor(public readonly token: string) { }
}

export class AuthorizationErrorResponse {
    constructor(public readonly error: string) { }
}

const OAUTH_STATE = 'oauth_state';

@Injectable()
export class OAuth2ImplicitFlowService {

    private readonly authzUrlTemplate: URITemplate;
    private readonly baseAddress: string;
    private readonly crypto: Crypto;
    private readonly storage: Storage;

    constructor(private readonly cloud: CloudConfiguration, private readonly location: Location, window: WindowRef) {
        this.authzUrlTemplate = UriTemplate(cloud.authzEndpoint +
            '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');

        const nativeWindow = window.nativeWindow;
        this.baseAddress = nativeWindow.location.origin;
        this.crypto = nativeWindow.crypto;
        this.storage = nativeWindow.sessionStorage;
    }

    prepareAuthzRequest(localRedirectUri: string = ''): string {
        const bytes = new Uint8Array(128 / 8);
        this.crypto.getRandomValues(bytes);
        const state = base64url.encode(new Buffer(bytes));

        this.storage.setItem(OAUTH_STATE, state);

        return this.authzUrlTemplate.fillFromObject({
            client_id: this.cloud.clientId,
            redirect_uri: this.baseAddress + this.location.prepareExternalUrl(localRedirectUri),
            state
        });
    }

    processAuthzResponse(fragment: string): AuthorizationSuccessResponse | AuthorizationErrorResponse {

        const res = <any>Uri.parseQuery(fragment);

        if (!res.state) {
            return new AuthorizationErrorResponse('invalid response');
        }

        // Check state against existing state
        const state = this.storage.getItem(OAUTH_STATE);
        this.storage.removeItem(OAUTH_STATE);
        if (!state || state !== res.state) {
            return new AuthorizationErrorResponse('missing or invalid state');
        }

        if (res.error) {
            return new AuthorizationErrorResponse(res.error);
        }

        if (!res.access_token) {
            return new AuthorizationErrorResponse('invalid response');
        }

        return new AuthorizationSuccessResponse(res.access_token);
    }
}
