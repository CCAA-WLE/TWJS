(function () {
    'use strict';
    angular.module("twjs")
        .factory('twAuthStorage', ['twConfig', '$window',
            function (twConfig, $window) {

                var _lastRequest = null;

                var storageType = (twConfig.authStorageType === 1 || !twConfig.authStorageType) ? $window.sessionStorage : $window.localStorage;

                return {
                    getUserStore: getUserStore,
                    setUserStore: setUserStore,
                    clearUserStore: clearUserStore,
                    getLastRequest: getLastRequest,
                    updateLastRequest: updateLastRequest
                };

                function checkTypeChange() {
                    storageType = (twConfig.authStorageType === 1 || !twConfig.authStorageType) ? $window.sessionStorage : $window.localStorage;
                }

                function getUserStore() {
                    checkTypeChange();
                    var $window = angular.injector(['ng']).get('$window');
                    var u = storageType.getItem(twConfig.storageAuthName);
                    return (u != "" && u != null) ? angular.fromJson(u) : null;
                }
                function setUserStore(userModel) {
                    checkTypeChange();
                    var $window = angular.injector(['ng']).get('$window');
                    return storageType.setItem(twConfig.storageAuthName, angular.toJson(userModel));
                }

                function clearUserStore() {
                    checkTypeChange();
                    var $window = angular.injector(['ng']).get('$window');
                    storageType.removeItem(twConfig.storageAuthName);
                }

                function getLastRequest() {
                    return _lastRequest;
                }

                function updateLastRequest() {
                    _lastRequest = new Date();
                }
            }
        ]);
})();