angular.module('cloudPlayer.directives', [])

    .directive('cpConfirmClick', ['$window', function ($window) {
        return {
            restrict: 'A',
            scope: { clickAction: '&cpConfirmClick' },
            link: function (scope, element, attrs) {
                element.bind('click', function () {
                    if ($window.confirm('Are you sure?')) {
                        scope.clickAction();
                    }
                });
            }
        };
    }])

    .directive('cpBind', [function () {
        return {
            restrict: 'A',
            scope: { eventName: '@cpBind', handler: '&cpBindHandler' },
            link: function (scope, element, attrs) {
                element.bind(scope.eventName, scope.handler);
            }
        };
    }])

    ;