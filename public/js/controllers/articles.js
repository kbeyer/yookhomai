angular.module('mean.articles').controller('ArticlesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
    $scope.global = Global;
    if(!$scope.global.user){ $location.path('/w'); return false; }

    $scope.nameMaxCharacters = 10;
    $scope.pinching = false;

    $scope.create = function() {
        var article = new Articles({
            title: this.title,
            content: this.content,
            source: 'web'
        });
        article.$save(function(response) {
            // go home after save
            $location.path("/");
        });

        this.title = "";
        this.content = "";

        return false;
    };

    $scope.changeStatus = function(article, status){
        // special confirm for remove
        if(status === 'removed'){
            if(!confirm('Are you sure you want to delete this item?')){ return false; }
            // remove locally first ... then persist to DB
            for (var i in $scope.articles) {
                if ($scope.articles[i] == article) {
                    $scope.articles.splice(i, 1);
                }
            }
        }

        // update status so that UI is updated...
        article.status = status;

        // if local update only ... then we're done
        if(!article._id){ return false; }

        if (!article.updated) {
            article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
            // TODO: reflect server status in UI
        });
    };

    $scope.delete = function(article) {
        if(!confirm('Are you sure you want to delete this item?')){ return false; }

        var localRemove = function(article){
            for (var i in $scope.articles) {
                if ($scope.articles[i] == article) {
                    $scope.articles.splice(i, 1);
                }
            }
        };

        if(!article._id){ localRemove(article); }

        article.$remove(function(){
            localRemove(article);
        });

        return false;

    };

    $scope.update = function() {
        var article = $scope.article;
        if (!article.updated) {
            article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
            // show list page after update
            $location.path('/');
        });

        return false;
    };

    $scope.handleTouchEvent = function(ev, article){

        if(!ev){ return false; }

        var setContainerOffset = function($element, percent, animate) {
            var pane_width = $element.width();
            var pane_count = 1;

          $element.removeClass("animate");

          if(animate) {
              $element.addClass("animate");
          }

          if(Modernizr.csstransforms3d) {
              $element.css("transform", "translate3d("+ percent +"%,0,0) scale3d(1,1,1)");
          }
          else if(Modernizr.csstransforms) {
              $element.css("transform", "translate("+ percent +"%,0)");
          }
          else {
              var px = ((pane_width*pane_count) / 100) * percent;
              $element.css("left", px+"px");
          }
        };

      console.log(ev);
      var $element = $(ev.currentTarget);
      var pane_width = $element.width();
      var pane_count = 1;
      var current_pane = 0;
      // disable browser scrolling
      ev.gesture.preventDefault();

      switch(ev.type) {
          case 'pinchout': 
              $scope.pinching = true;
              //ev.gesture.stopDetect();
              break;
          case 'dragright':
          case 'dragleft':

                $scope.pinching = false;
              // stick to the finger
              var pane_offset = -(100/pane_count)*current_pane;
              var drag_offset = ((100/pane_width)*ev.gesture.deltaX) / pane_count;

              // slow down at the first and last pane
              if((current_pane === 0 && ev.gesture.direction === Hammer.DIRECTION_RIGHT) ||
                  (current_pane === pane_count-1 && ev.gesture.direction === Hammer.DIRECTION_LEFT)) {
                  drag_offset *= 0.42;
              }

              setContainerOffset($element, drag_offset + pane_offset);
              break;

          case 'swipeleft':
            $scope.pinching = false;
              $scope.changeStatus(article, 'unanswered');
              setContainerOffset($element, 0);
              ev.gesture.stopDetect();
              break;

          case 'swiperight':
            $scope.pinching = false;
              $scope.changeStatus(article, 'answered');
                setContainerOffset($element, 0);
              ev.gesture.stopDetect();
              break;

          case 'release':
              if($scope.pinching){
                window.location = '/pray?id=' + article._id;
                $scope.pinching = false; 
              }
              // more then 50% moved, re-activate or remove
              // IMPORTANT .. this check must be befor answered/unanswered check
              else if(Math.abs(ev.gesture.deltaX) > pane_width/1.2) {
                  if(ev.gesture.direction == 'right') {
                      $scope.changeStatus(article, 'active');
                      setContainerOffset($element, 0);
                  } else {
                    $scope.changeStatus(article, 'removed');
                    setContainerOffset($element, 0);
                  }
              }
              // more then 10% moved, mark answered / unanswered
              else if(Math.abs(ev.gesture.deltaX) > pane_width/4) {
                  if(ev.gesture.direction == 'right') {
                      $scope.changeStatus(article, 'answered');
                      setContainerOffset($element, 0);
                  } else {
                    $scope.changeStatus(article, 'unanswered');
                    setContainerOffset($element, 0);
                  }
              }
              else {
                    // TODO: snap back
                  //self.showPane(current_pane, true);
                    setContainerOffset($element, 0);
              }
              break;
      }
    };

    $scope.find = function(query) {
        if(!$scope.global.user){ $location.path('/w'); return false; }
        Articles.query(query, function(articles) {
            if(!articles || articles.length === 0){
                articles = [];
                if($scope.global.hasTouch){
                    articles.push({title: 'Touch an item to edit', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Swipe right to mark answered', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Swipe left to remove', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Pinch out to enter pray mode', user: {_id: $scope.global.user._id}});
                }else{
                    articles.push({title: 'Click an item to edit', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Use thumbs up to mark answered', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Thumbs down to mark unanswered', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Click X to remove', user: {_id: $scope.global.user._id}});
                    articles.push({title: 'Click play button to enter pray mode', user: {_id: $scope.global.user._id}});
                }
            }
            $scope.articles = articles;
        });
    };

    $scope.saveNew = function($event){
        if(!$event){ return false; }
        var newText = $event.target.value;
        if(newText === ''){ return false; }

        var article = new Articles({
            title: newText,
            source: 'web'
        });
        article.$save(function(response) {
            // add to current list
            $scope.articles.unshift(response);
            $event.target.value = '';
        });

        $event.target.value = 'Saving...';

        return false;
    };
    $scope.updateExisting = function($event){

        if(!$event){ return false; }

        var input = $event.target;
        var article = this.article;
        // check if text changed
        if(input.value === article.title){ return false; }

        // mark disabled while updating
        input.disabled = true;

        if (!article.updated) {
            article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
            // mark enabled after save
            input.disabled = false;
        });

        return false;
    };

    $scope.slides = function(){

        var renderShow = function(){
            // Setup Slideshow
            $('#slider4').responsiveSlides({
                auto: false,
                pager: false,
                nav: true,
                speed: 500,
                namespace: 'slides',
                before: function () {
                  //$('.events').append("<li>before event fired.</li>");
                },
                after: function () {
                  //$('.events').append("<li>after event fired.</li>");
                }
            });
        };
        Articles.query(null, function(articles) {
            $scope.articles = articles;
            renderShow();
        });
    };

    $scope.findOne = function() {
        Articles.get({
            articleId: $routeParams.articleId
        }, function(article) {
            $scope.article = article;
        });
    };
}]);