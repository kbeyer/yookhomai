angular.module('mean.articles').controller('ArticlesController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function ($scope, $routeParams, $location, Global, Articles) {
    $scope.global = Global;
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
            $location.path("/");
        });

        for (var i in $scope.articles) {
            if ($scope.articles[i] == article) {
                $scope.articles.splice(i, 1);
            }
        }
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
        Articles.query(query, function(articles) {
            $scope.articles = articles;
        });
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