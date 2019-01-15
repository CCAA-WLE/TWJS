(function () {
    'use strict';
    angular.module("twjs")
        .factory('twLog', ['$log', 'twConfig', function ($log, twConfig) {

            var logLevel = {
                ERROR: 1,
                WARNING: 2,
                DEBUG: 4,
                INFO: 8,
                LOG: 16
            };

            function log(msg, level) {
                if (level === logLevel.ERROR && (twConfig.logDebugLevel & logLevel.ERROR > 0)) {
                    $log.error(msg);
                }
                if (level === logLevel.WARNING && (twConfig.logDebugLevel & logLevel.WARNING > 0)) {
                    $log.warn(msg);
                }
                if (level === logLevel.DEBUG && (twConfig.logDebugLevel & logLevel.DEBUG > 0)) {
                    $log.debug(msg);
                }
                if (level === logLevel.INFO && (twConfig.logDebugLevel & logLevel.INFO > 0)) {
                    $log.info(msg);
                }
                if (level === logLevel.LOG && (twConfig.logDebugLevel & logLevel.LOG > 0)) {
                    $log.log(msg);
                }
            }

            return {
                log: log,
                logLevel: logLevel
            };

        }]);
})();