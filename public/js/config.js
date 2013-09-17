//Setting up route
window.app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/p', {
            templateUrl: 'views/articles/list.html'
        }).
        when('/p/create', {
            templateUrl: 'views/articles/create.html'
        }).
        when('/p/:articleId/edit', {
            templateUrl: 'views/articles/edit.html'
        }).
        when('/p/:articleId', {
            templateUrl: 'views/articles/view.html'
        }).
        when('/', {
            templateUrl: 'views/index.html'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);

//Setting HTML5 Location Mode
window.app.config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix("!");
    }
]);