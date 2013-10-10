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

    $scope.remove = function(article) {
        if(!confirm('Are you sure you want to delete this item?')){ return false; }

        article.$remove(function(){
            for (var i in $scope.articles) {
                if ($scope.articles[i] == article) {
                    $scope.articles.splice(i, 1);
                }
            }
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
                articles.push({title: 'Tap an item to edit', user: {_id: $scope.global.user._id}});
                articles.push({title: 'Swipe right to mark answered', user: {_id: $scope.global.user._id}});
                articles.push({title: 'Swipe left to remove', user: {_id: $scope.global.user._id}});
                articles.push({title: 'Click the play button to pray', user: {_id: $scope.global.user._id}});
            }
            $scope.articles = articles;
        });
    };

    $scope.saveNew = function($event){
        if(!$event){ return false; }
        var newText = $event.target.value;
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
        // mark disabled while updating
        input.disabled = true;

        var article = this.article;
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