(function () {
    'use strict';
    angular.module("twjs")
        .provider('twConfig', [
            function () {
                var configurations = {};

                this.logDebugLevel = function (value) {
                    configurations.logDebugLevel = value;
                }

                this.serviceUrl = function (value) {
                    configurations.serviceUrl = value;
                }

                this.storageAuthName = function (value) {
                    configurations.storageAuthName = value;
                }

                this.authEndpoint = function (value) {
                    configurations.authEndpoint = value;
                }

                this.onRefreshTokenError = function (value) {
                    configurations.onRefreshTokenError = value;
                }

                this.suppressErrors = function (value) {
                    configurations.suppressErrors = value;
                }

                /**
                 * @method name description
                 * @arg value tipo de armazenamento esperado 1 = sessionStorage, 2 = localStorage
                 */
                this.authStorageType = function (value) {
                    configurations.authStorageType = value;
                };

                this.appKey = function (value) {
                    configurations.appKey = value;
                }

                this.appId = function (value) {
                    configurations.appId = value;
                }

                this.$get = [
                    function () {
                        return configurations;
                    }];


            }
        ]);
})();