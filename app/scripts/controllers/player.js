'use strict';

angular.module('cloudPlayer.controllers', ['cloudPlayer.oauth2'])
    .controller('PlayerCtrl', ['$scope', 'oAuth2ImplicitFlow', function ($scope, oAuth2ImplicitFlow) {
        $scope.message = oAuth2ImplicitFlow.prepareAuthzRequest();
    }]);