angular.module('mean.system').controller('HeaderController', ['$scope', 'Global', function ($scope, Global) {
    $scope.global = Global;

    $scope.menu = [{
        "title": "List",
        "link": "p"
    }, {
        "title": "New",
        "link": "p/create"
    }];
}]);