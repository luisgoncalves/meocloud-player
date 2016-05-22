'use strict';

angular.module('cloudPlayer.services', [])
    .factory('cloudClient', ['$window', '$http', 'cloudConfig', function ($window, $http, cloudConfig) {

        var adjustApiPath = cloudConfig.adjustApiPath || function (p) { return p; };
        var deltaUrl = cloudConfig.apiBaseAddress + adjustApiPath('/Delta');
        var mediaUrlTemplate = new URITemplate(cloudConfig.apiBaseAddress + adjustApiPath('/Media/') + cloudConfig.root + '{+path}');
        var deleteFileUrl = cloudConfig.apiBaseAddress + adjustApiPath('/Fileops/Delete');
        var headers = {
            Authorization: function () {
                return 'Bearer ' + getToken();
            }
        };

        var storage = $window.localStorage;
        const TokenKey = cloudConfig.name + '_oauth_token';
        var token = null;

        var getToken = function () {
            token = token || storage.getItem(TokenKey);
            return token;
        };

        var delta = function (cursor, callback) {
            $window.console.log('DELTA %s', cursor);
            return $http
                .post(deltaUrl, { cursor: cursor }, { headers: headers })
                .then(function (response) {
                    var data = response.data;
                    var updatedItems = [];
                    var deletedPaths = [];
                    data.entries.forEach(function (entry) {
                        // entry => [path, metadata]
                        var item = entry[1];
                        if (item != null) {
                            item.path = entry[0]; // Easier for later comparisons (casing is diferent on 'path' and on 'metadata.path')
                            updatedItems.push(entry[1]);
                        } else {
                            deletedPaths.push(entry[0]);
                        }
                    });

                    var promise = callback(updatedItems, deletedPaths, data.cursor);

                    if (data.has_more) {
                        promise = promise.then(function () {
                            // When 'then' callbacks return a promise, it is chained.
                            return delta(data.cursor, callback);
                        });
                    }

                    return promise;
                });
        };

        return {

            hasToken: function () {
                return getToken() !== null;
            },
            setToken: function (accessToken) {
                storage.setItem(TokenKey, accessToken);
                token = null;
            },

            // Checks for incoming changes since a given reference cursor.
            delta: delta,

            // Get a direct URL for a file given its path on the cloud.
            getFileUrl: function (filePath) {
                return $http({
                    method: 'POST',
                    url: mediaUrlTemplate.expand({ path: filePath }),
                    headers: headers
                }).then(function (response) {
                    return response.data;
                });
            },

            // Delete a file given its path on the cloud.
            deleteFile: function (filePath) {
                return $http.post(
                    deleteFileUrl,
                    { path: filePath, root: root },
                    { headers: headers });
            }
        };
    }]);