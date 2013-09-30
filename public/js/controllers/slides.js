angular.module('mean.slides').controller('SlidesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
  $scope.global = Global;
  $scope.swipeEnabled = false;
  // then check if it should be swipe enabled
  Modernizr.load({
    test: Modernizr.touch && Modernizr.csstransitions,
    yep: '/lib/Swipe/swipe.js',
    complete: function() {
      if (Modernizr.touch && Modernizr.csstransitions) {
        $scope.swipeEnabled = true;
      }
    }
  });

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
    scope.mySwipe = new Swipe($("#slide-carousel .carousel-inner")[0], {
      callback: function(event, index, elem) {
        //updateNav(index);
        //loadImg(index + 1);
        alert('swipe callback for index ' + index);
      } 
    });
  };


  var directiveDefinitionObject = {
    link: function postLink(scope, iElement, iAttrs) {
      if(scope.swipeEnabled){
        buildSwipe(scope);
      }else{
        buildCarousel();
      }

    }
  };
  return directiveDefinitionObject;

});