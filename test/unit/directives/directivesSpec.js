describe("confirm-click directive", function () {

    var $scope, $window;
    var directiveElement;
    var userAction;

    beforeEach(module('cloudPlayer.directives'));

    // Mock $window.confirm()
    beforeEach(function () {
        $window = {
            confirm: jasmine.createSpy().and.callFake(function () {
                return userAction;
            })
        };
        module(function ($provide) {
            $provide.value('$window', $window);
        });
    });

    // Get a scope and compile the directive
    beforeEach(inject(function ($compile, $rootScope) {
        $scope = $rootScope.$new();
        $scope.test = jasmine.createSpy();

        directiveElement = $compile('<button cp-confirm-click="test()">Click me</button>')($scope);
    }));

    it("calls click handler when confirmed", function () {
        userAction = true;
        directiveElement.triggerHandler('click');

        expect($window.confirm).toHaveBeenCalled();
        expect($scope.test).toHaveBeenCalled();
    });

    it("doesn't call click handler when rejected", function () {
        userAction = false;
        directiveElement.triggerHandler('click');

        expect($window.confirm).toHaveBeenCalled();
        expect($scope.test).not.toHaveBeenCalled();
    });
});

describe("bind directive", function () {

    var $scope;
    var directiveElement;

    beforeEach(module('cloudPlayer.directives'));

    // Get a scope and compile the directive
    beforeEach(inject(function ($compile, $rootScope) {
        $scope = $rootScope.$new();
        $scope.test = jasmine.createSpy();

        directiveElement = $compile('<button cp-bind="xpto" cp-bind-handler="test()">Click me</button>')($scope);
    }));

    it("calls the specified handler", function(){
        directiveElement.triggerHandler('xpto');
        expect($scope.test).toHaveBeenCalled();
    });

});