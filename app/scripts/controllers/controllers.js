'use strict';

angular.module('cloudPlayer.controllers', ['cloudPlayer.oauth2', 'cloudPlayer.services'])

    .controller('HomeCtrl', ['$window', '$location', '$scope', 'cloudConfig',
        function ($window, $location, $scope, cloudConfig) {

            $scope.cloudName = cloudConfig.displayName;

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
        }])

    .controller('OAuthCtrl', ['$window', '$location', '$routeParams', '$scope', 'oAuth2ImplicitFlow', 'cloudClient',
        function ($window, $location, $routeParams, $scope, oAuth2ImplicitFlow, cloudClient) {

            if ($routeParams.mode === 'authorize') {
                $window.location.href = oAuth2ImplicitFlow.prepareAuthzRequest('');
            } else if ($routeParams.mode === 'callback') {
                var res = oAuth2ImplicitFlow.processAuthzResponse(URI.parseQuery($location.hash()));
                if (res.success) {
                    cloudClient.setToken(res.accessToken);
                    $location.url('/player');
                } else {
                    $scope.hasError = true;
                    $scope.error = res.error;
                }
            }
        }])

    .controller('PlayerCtrl', ['$location', '$scope', 'cloudConfig', 'fileManager',
        function ($location, $scope, cloudConfig, fileManager) {

            var emptyFile = {
                artist: 'Artist',
                title: 'Title',
                album: 'Album',
                year: 'year',
                url: '',
            };

            $scope.showFileInfo = cloudConfig.shouldReadTags;
            $scope.currentFile = emptyFile;
            $scope.canPlay = false;
            $scope.canDelete = false;

            if (!fileManager.client.hasToken()) {
                $location.path('/');
                return;
            }

            $scope.next = function () {
                $scope.canDelete = false;
                return fileManager.getRandomFileUrl().then(function (fileUrl) {
                    $scope.currentFile = {
                        url: fileUrl
                    };
                    $scope.canDelete = true;
                })
            };

            $scope.deleteCurrent = function () {

                $scope.canPlay = false;
                $scope.canDelete = false;
                $scope.currentFile = emptyFile;

                fileManager.deleteCurrentFile().then(function () {
                    if (fileManager.hasFiles()) {
                        $scope.next().then(function () {
                            $scope.canPlay = true;
                        });
                    }
                });
            };

            fileManager.update()
                .then(function () {
                    if (fileManager.hasFiles()) {
                        $scope.next().then(function () {
                            $scope.canPlay = true;
                        });
                    }
                });
        }])

    ;