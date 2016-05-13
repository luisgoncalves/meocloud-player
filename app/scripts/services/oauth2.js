'use strict';

angular.module('cloudPlayer.oauth2', [])

    // Base64 URL encoding
    .value('base64url', {
        encode: function (bytes) {
            return btoa(bytes)
                // From https://github.com/RGBboy/urlsafe-base64
                .replace(/\+/g, '-') // Convert '+' to '-'
                .replace(/\//g, '_') // Convert '/' to '_'
                .replace(/=+$/, ''); // Remove ending '='
        }
    })

    // OAuth 2.0 implicit flow logic
    .factory('oAuth2ImplicitFlow', ['cloudConfig', 'base64url', function (cloudConfig, base64url) {
        return oAuth2ImplicitFlow(
            cloudConfig.authzEndpoint,
            window.location.hostname == 'localhost' ? cloudConfig.clientIds.dev : cloudConfig.clientIds.pub, // TODO use $location
            window.location.origin + window.location.pathname, // TODO use $location
            base64url
        );
    }])

    ;

function oAuth2ImplicitFlow(authzEndpoint, clientId, redirectUri, base64url) {

    var storage = window.localStorage;
    var crypto = window.crypto;
    const StateKey = 'oauth_state';

    var authzUrlTemplate = new URITemplate(authzEndpoint + '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');

    return {
        prepareAuthzRequest: function () {
            var state = new Uint8Array(128 / 8);
            crypto.getRandomValues(state);
            state = base64url.encode(state);
            storage.setItem(StateKey, state);

            var authzRequest = authzUrlTemplate.expand({
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state
            });
            return authzRequest;
        },

        processAuthzResponse: function (res, success, error) {
            if (!res.state) {
                error('invalid response');
                return;
            }

            // Check state
            var state = storage.getItem(StateKey);
            storage.removeItem(StateKey);
            if (!state || state !== res.state) {
                error('missing or invalid state');
                return;
            }

            if (res.error) {
                error(res.error);
                return;
            }

            if (!res.access_token) {
                error('invalid response');
                return;
            }

            success(res.access_token, res.expires_in);
        }
    };
};