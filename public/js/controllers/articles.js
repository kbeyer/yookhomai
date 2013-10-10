angular.module('mean.articles').controller('ArticlesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
    $scope.global = Global;
    if(!$scope.global.user){ $location.path('/w'); return false; }

    $scope.nameMaxCharacters = 10;

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

    $scope.answered = function(article){

        article.status = 'answered';

        // don't persist to server is local
        if(!article._id){ return false; }

        if (!article.updated) {
            article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
            // show marked out locally ... via binding
        });
    };
    $scope.unanswered = function(article){

        article.status = 'unanswered';

        // don't persist to server is local
        if(!article._id){ return false; }

        if (!article.updated) {
            article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
            // show marked out locally ... via binding
        });
    };

    $scope.remove = function(article) {
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