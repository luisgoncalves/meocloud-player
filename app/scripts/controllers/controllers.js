'use strict';

angular.module('cloudPlayer.controllers', ['cloudPlayer.oauth2'])

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

    .controller('OAuthCtrl', ['$window', '$location', '$routeParams', '$scope', 'oAuth2ImplicitFlow',
        function ($window, $location, $routeParams, $scope, oAuth2ImplicitFlow) {

            if ($routeParams.mode === 'authorize') {
                $window.location.href = oAuth2ImplicitFlow.prepareAuthzRequest('');
            } else if ($routeParams.mode === 'callback') {
                var res = oAuth2ImplicitFlow.processAuthzResponse(URI.parseQuery($location.hash()));
                if (res.success) {
                    // TODO store token
                    $location.url('/player');
                } else {
                    $scope.hasError = true;
                    $scope.error = res.error;
                }
            }
        }])

    .controller('PlayerCtrl', ['$scope', function ($scope) {
    }])

    ;