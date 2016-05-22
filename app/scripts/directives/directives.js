angular.module('cloudPlayer.directives', [])
    .directive('cpConfirmClick', ['$window', function ($window) {
        return {
            restrict: 'A',
            scope: { clickAction: "&cpConfirmClick" },
            link: function (scope, element, attrs) {
                element.bind('click', function () {
                    if ($window.confirm('Are you sure?')) {
                        scope.clickAction();
                    }
                });
            }
        };
    }]);