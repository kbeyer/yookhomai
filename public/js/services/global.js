angular.module('mean.system').factory("Global", [function() {
    var _this = this;
    _this._data = {
        user: window.user,
        authenticated: !! window.user,
        hasTouch: !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator)
    };

    return _this._data;
}]);