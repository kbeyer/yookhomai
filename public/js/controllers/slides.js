angular.module('mean.slides').controller('SlidesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
  $scope.global = Global;
  $scope.swipeEnabled = Modernizr.touch && Modernizr.csstransitions;

  $scope.myInterval = 5000;

  $scope.slides = function(){
    Articles.query(null, function(articles) {
      $scope.slides = articles;
    });
  };

}])
/* directive for setting up slider after HTML is rendered */
.directive('swipableSlides', function factory($location) {

  //Build carousel
  var buildCarousel = function(){
    $('#slide-carousel').carousel({
      interval: 5000
    });
  };

  //Swipe enable Carousel
  var buildSwipe = function(scope) {
    // hide carousel controls
    $('.carousel-control').hide();
    //Initialize Swipe.js
    scope.mySwipe = new Swipe(document.getElementById('slide-carousel'), {
        startSlide: 1,
        speed: 500,
        auto: 10000,
        continuous: true,
        disableScroll: false,
        stopPropagation: false,
        callback: function(index, elem) {},
        transitionEnd: function(index, elem) {}
      });
  };


  var directiveDefinitionObject = {
    link: function postLink(scope, iElement, iAttrs) {

      scope.$watch('slides', function(newSlides, oldSlides){
        if(scope.swipeEnabled){
          buildSwipe(scope);
        }else{
          buildCarousel();
        }
      });

    }
  };
  return directiveDefinitionObject;

});