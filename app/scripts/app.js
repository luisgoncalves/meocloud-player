'use strict';
(function () {
    var app = angular.module('cloudPlayer', [
        'ngRoute',
        'cloudPlayer.controllers'
    ]);

    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                controller: 'PlayerCtrl',
                templateUrl: 'views/player.html'
            })
            .otherwise({
                'redirectTo': '/'
            });
    }]);
})();