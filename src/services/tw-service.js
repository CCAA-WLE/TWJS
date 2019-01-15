(function () {
  'use strict';
  angular.module("twjs")
    .factory('twService', ['$rootScope', '$state', '$q', '$http', '$httpParamSerializerJQLike', '$timeout', '$uibModal', 'twLog', 'twAlert', 'twConfig', 'twAuthStorage',
      function ($rootScope, $state, $q, $http, $httpParamSerializerJQLike, $timeout, $uibModal, twLog, twAlert, twConfig, twAuthStorage) {

        var basic = function (obj, url) {

          function result_success(result) {
            return result.data;
          }

          function req(service, data, config) {

            function fail(err) {

              var msg = "";

              switch (err.status) {
                case -1:
                  msg = "Falha ao acessar o servidor. Verifique sua internet.";
                  // DetectInternetConnection.setStatus(false);
                  break;
                case 401:
                  msg = "Serviço não autorizado. Verifique se você tem permissão para acessar esse recurso.";
                  break;
                case 404:
                  msg = "Serviço não localizado. Talvez ele esteja apenas indisponível.";
                  break;
                default:
                  msg = "Falha na chamada do serviço.";
                  break;
              }

              if (err.status != 401) {
                twLog.log(err.config.method + ": " + err.config.url, twLog.logLevel.INFO);
                if (err.data && err.data.ExceptionType === 'Barn.Util.BarnWarning') {
                  msg = (err.data && err.data.ExceptionMessage) ? err.data.ExceptionMessage : msg;
                  twAlert.showWarning("Alerta sobre a operação", msg);
                } else {
                  if (!twConfig.suppressErrors)
                    twAlert.showError("Erro no servidor", msg);
                }

                return $q.reject(err);
              } else {
                oAuth(obj).refreshToken()
                  .then(function () {
                    return this.req(service, data, config);
                  })
                  .catch(twConfig.onRefreshTokenError);
              }
            }

            // if (!DetectInternetConnection.getStatus()) {
            //     DetectInternetConnection.setStatus(true);
            // }
            //REVER ABSTRAÇÃO

            config = config || {};
            config.supressError = config.supressError || false;

            if (!config.headers) {
              config.headers = {};
            }
            config.headers.timestamp = new Date().toISOString();

            if (config.supressError) {
              return $http.post(twConfig.serviceUrl + url + service, data, config).then(result_success);
            } else {
              return $http.post(twConfig.serviceUrl + url + service, data, config).then(result_success, fail);
            }
            //REVER ABSTRAÇÃO
          }


          var res = {
            request: req
          };

          return _.extend(obj, res);

        }

        function oAuth(obj) {
          var authData = null;

          var refreshTokenService = function (data) {
            twAuthStorage.clearUserStore();
            $rootScope.$broadcast("app.logoff");

            var defaultRequestData = {
              grant_type: 'refresh_token',
            };
            var requestData = _.merge(defaultRequestData, data);

            return $http({
              method: 'POST',
              url: twConfig.authEndpoint,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
              },
              data: $httpParamSerializerJQLike(requestData)
            }).then(function (response) {
              if (response.status == 200) {
                authData = response.data;
                twAuthStorage.setUserStore(authData);
                $rootScope.$broadcast("app.logon", authData);
                return authData;
              }
            }).catch(function (err) {
              return $q.reject("Falha na autenticação automática");
            });
          };

          function refreshToken(data) {
            var authUser = twAuthStorage.getUserStore();
            if (!authUser) {
              return $q.reject("Não autenticado");;
            }
            if (!data)
              data = authUser;

            return refreshTokenService(data)
              .catch(function (err) {
                return $q.reject(err);
              });
          }

          var login = function (userModel) {
            var data = "grant_type=password&username=" + encodeURIComponent(userModel.username) + "&password=" + encodeURIComponent(userModel.password);
            var cfg = {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(twConfig.appId + ':' + twConfig.appKey),
                'KeepConnected': false
              },
              xhrFields: {
                withCredentials: true
              }
            };

            if (userModel.keepConnected)
              cfg.headers['KeepConnected'] = true;

            return $http.post(twConfig.authEndpoint, data, cfg)
              .then(function (response) {
                authData = response.data;
                twAuthStorage.setUserStore(authData);
                $rootScope.$broadcast("app.logon", authData);
                return authData;
              },
                function (e) {
                  logout();
                  return $q.reject(e);
                })
          }

          function logout() {
            twAuthStorage.clearUserStore();
            $rootScope.$broadcast("app.logoff");
          }

          function checkProfile(arr) {
            if (authData == null)
              return false;
            else
              return arr.indexOf(authData.profile) >= 0;
          }

          function isAuthenticated() {
            var authData = restore();

            return authData !== null;
          }

          function restore() {
            authData = twAuthStorage.getUserStore();

            if (authData == null || authData.access_token == null)
              return null;
            else
              return authData;
          }

          var res = {
            refreshToken: refreshToken,
            login: login,
            logout: logout,
            restore: restore,
            checkProfile: checkProfile,
            isAuthenticated: isAuthenticated
          };

          return _.extend(obj, basic(res, ''));
        }
        var crud = function (obj, url) {

          var cachedData = [];

          function listCached(filter) {
            return $q(function (resolve, reject) {
              $timeout(function () {
                resolve(
                  (
                    (cachedData.length === 0) ?
                      obj.list({}).then(function (r) {
                        cachedData = r;
                        return ((filter) ? cachedData.filter(filter) : cachedData);
                      }) :
                      ((filter) ? cachedData.filter(filter) : cachedData)
                  )
                );

              }, 0, true);
            });
          }

          var res = {

            get: function (pk) {
              return this.request("get", pk)
            },
            getOne: function (pk) {
              return this.request("getone", pk);
            },
            getAll: function (filter) {
              return this.request("getall", filter);
            },
            put: function (mdl) {
              return this.request("put", mdl);
            },
            post: function (mdl) {
              return this.request("post", mdl);
            },
            del: function (pk) {
              return this.request("del", pk);
            },
            toggle: function (mdl) {
              return this.request("toggle", mdl);
            },
            list: function (filter) {
              return this.request("list", filter);
            },
            listCached: listCached
          }

          return angular.extend(obj, basic(res, url));
        };

        return {
          basic: basic,
          crud: crud,
          oAuth: oAuth
        };


      }
    ]);
})();