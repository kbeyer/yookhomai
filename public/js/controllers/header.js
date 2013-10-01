angular.module('mean.system').controller('HeaderController', ['$scope', 'Global', function ($scope, Global) {
    $scope.global = Global;

    $scope.menu = [];/*{
        "title": "Pray",
        "link": "p"
    },{
        "title": "Swipe",
        "link": "/pray"
    }];*/
}]);