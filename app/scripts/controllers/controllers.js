'use strict';

angular.module('cloudPlayer.controllers', ['cloudPlayer.oauth2', 'cloudPlayer.services'])

    .controller('HomeCtrl', ['$window', '$location', 'cloudConfig',
        function ($window, $location, cloudConfig) {

            this.cloudName = cloudConfig.displayName;

            // OAuth callbacks are delivered on the root; route accordingly if needed.
            if ($location.hash()) {
                $location.path('/oauth/callback');
            }

            // MEO Cloud has a bug and doesn't return errors on the URL fragment. Assume this
            // is a bogus OAuth callback if it has query string.
            var url = new URI($location.absUrl());
            if (url.query()) {
                url.hash(url.query());
                url.query('');
                $window.location.href = url.toString();
                return;
            }
            
            $location.url('/player');
        }])

    .controller('OAuthCtrl', ['$window', '$location', '$routeParams', 'oAuth2ImplicitFlow', 'cloudClient',
        function ($window, $location, $routeParams, oAuth2ImplicitFlow, cloudClient) {

            if ($routeParams.mode === 'authorize') {
                $window.location.href = oAuth2ImplicitFlow.prepareAuthzRequest('');
            } else if ($routeParams.mode === 'callback') {
                var res = oAuth2ImplicitFlow.processAuthzResponse(URI.parseQuery($location.hash()));
                if (res.success) {
                    cloudClient.setToken(res.accessToken);
                    $location.url('/player');
                } else {
                    this.hasError = true;
                    this.error = res.error;
                }
            }
        }])

    .controller('PlayerCtrl', ['$location', 'cloudConfig', 'fileManager',
        function ($location, cloudConfig, fileManager) {

            var emptyFile = function (url) {
                return {
                    artist: 'Artist',
                    title: 'Title',
                    album: 'Album',
                    year: 'year',
                    url: url
                }
            };

            var ctrl = this;

            ctrl.showFileInfo = cloudConfig.shouldReadTags;
            ctrl.currentFile = emptyFile();
            ctrl.canPlay = false;
            ctrl.canDelete = false;

            if (!fileManager.client.hasToken()) {
                $location.path('/');
                return;
            }

            ctrl.next = function () {
                ctrl.canDelete = false;
                return fileManager.getRandomFileData().then(function (data) {
                    ctrl.currentFile = emptyFile(data.url);
                    ctrl.canDelete = true;

                    if (cloudConfig.shouldReadTags && data.readTags) {
                        data.readTags().then(function (tags) {
                            ctrl.currentFile.artist = tags.artist || 'N/A';
                            ctrl.currentFile.title = tags.title || 'N/A';
                            ctrl.currentFile.album = tags.album || 'N/A';
                            ctrl.currentFile.year = tags.year || 'N/A';
                        });
                    }
                })
            };

            ctrl.deleteCurrent = function () {

                ctrl.canPlay = false;
                ctrl.canDelete = false;
                ctrl.currentFile = emptyFile;

                fileManager.deleteCurrentFile().then(function () {
                    if (fileManager.hasFiles()) {
                        ctrl.next().then(function () {
                            ctrl.canPlay = true;
                        });
                    }
                });
            };

            fileManager.update()
                .then(function () {
                    if (fileManager.hasFiles()) {
                        ctrl.next().then(function () {
                            ctrl.canPlay = true;
                        });
                    }
                });
        }])

    ;