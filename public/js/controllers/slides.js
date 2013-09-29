angular.module('mean.slides').controller('SlidesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
  $scope.global = Global;

  $scope.myInterval = 5000;

  $scope.slides = function(){
    Articles.query(null, function(articles) {
      $scope.slides = articles;
    });
  };

}]);