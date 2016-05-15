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
    .factory('oAuth2ImplicitFlow', ['$window', 'cloudConfig', 'base64url', function ($window, cloudConfig, base64url) {
        return oAuth2ImplicitFlow(
            cloudConfig.authzEndpoint,
            $window.location.hostname === 'localhost' || $window.location.hostname === '127.0.0.1' ? cloudConfig.clientIds.dev : cloudConfig.clientIds.pub,
            $window.location.origin + $window.location.pathname,
            base64url,
            $window.localStorage
        );
    }])

    ;

function oAuth2ImplicitFlow(authzEndpoint, clientId, baseAddress, base64url, storage) {

    var crypto = window.crypto;
    const StateKey = 'oauth_state';

    var authzUrlTemplate = new URITemplate(authzEndpoint + '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');

    return {
        prepareAuthzRequest: function (redirectUri) {
            var state = new Uint8Array(128 / 8);
            crypto.getRandomValues(state);
            state = base64url.encode(state);
            storage.setItem(StateKey, state);

            var authzRequest = authzUrlTemplate.expand({
                client_id: clientId,
                redirect_uri: baseAddress + redirectUri,
                state: state
            });
            return authzRequest;
        },

        processAuthzResponse: function (res) {

            var error = function (e) {
                return {
                    success: false,
                    error: e
                };
            };

            if (!res.state) {
                return error('invalid response');
            }

            // Check state
            var state = storage.getItem(StateKey);
            storage.removeItem(StateKey);
            if (!state || state !== res.state) {
                return error('missing or invalid state');
            }

            if (res.error) {
                return error(res.error);
            }

            if (!res.access_token) {
                return error('invalid response');
            }

            return {
                success: true,
                accessToken: res.access_token,
                expiresIn: res.expires_in
            }
        }
    };
};