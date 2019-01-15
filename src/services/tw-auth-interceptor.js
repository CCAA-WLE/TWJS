(function () {
    'use strict';
    angular.module("twjs")
        .factory('BearerAuthInterceptor', ["$q", "$rootScope", "twAuthStorage", function ($q, $rootScope, twAuthStorage) {
            var authData = twAuthStorage.getUserStore();

            $rootScope.$on('app.logon', function (arg, v) {
                authData = v;
            });
            $rootScope.$on('app.logoff', function (arg, v) {
                authData = null;
            });

            return {
                request: function (config) {
                    config.headers = config.headers || {};

                    if (authData && authData.access_token)
                        config.headers.Authorization = 'Bearer ' + authData.access_token;

                    twAuthStorage.updateLastRequest();

                    return $q.when(config);
                }
            };
        }])
        .config(["$httpProvider", function ($httpProvider) {
            $httpProvider.interceptors.push('BearerAuthInterceptor'); //OAuth 2.0
        }]);
})();
