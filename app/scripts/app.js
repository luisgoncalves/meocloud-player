'use strict';
(function () {
    var app = angular.module('cloudPlayer', [
        'ngRoute',
        'cloudPlayer.controllers',
        'cloudPlayer.oauth2'
    ]);

    var meocloudConfig = {
        authzEndpoint: 'https://meocloud.pt/oauth2/authorize',
        apiBaseAddress: 'https://publicapi.meocloud.pt/1',
        root: 'meocloud',
        clientIds: {
            dev: '4722fde2-2f99-4118-9373-3270c572d003',
            pub: '6abdf380-083a-453a-9e36-1b1528ab8255'
        },
        name: 'meocloud',
        shouldReadTags: false
    };

    app.constant('cloudConfig', meocloudConfig);

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