'use strict';

angular.module('cloudPlayer.services')
    .factory('fileManager', ['$window', 'cloudClient', 'cloudConfig', function ($window, cloudClient, cloudConfig) {
        return {
            client: cloudClient,
            update: null,
            getRandomFileUrl: null,
            deleteCurrentFile: null
        };
    }]);