(function (angular) {

  // Modules
  angular.module('twjs', [
    'ngSanitize',
    'ngAnimate',
    'pascalprecht.translate',
    'ui.bootstrap',
    'toaster'
  ]);

})(angular);
(function () {
  angular.module('twjs')
    .config(['$translateProvider', function ($translateProvider) {
      $translateProvider.translations('pt', {
        post: {
          title: 'Alteração de informações',
          message: 'Atualização realizada com sucesso!'
        },
        put: {
          title: 'Inclusão de informações',
          message: 'Cadastro realizado com sucesso!'
        },
        status: {
          title: 'Alteração de status',
          message: 'Atualização de status realizado com sucesso!'
        },
        del: {
          title: 'Exclusão de informações',
          message: 'Exclusão realizada com sucesso!'
        },
        errorQuery: {
          title: 'Resultado da Pesquisa:',
          message: 'Nenhum registro encontrado!'
        }
      });

      $translateProvider.preferredLanguage('pt');
    }]);
})();
(function () {
  'use strict';
  angular.module('twjs')
    .factory('twAlert', ['$translate', '$uibModal', 'toaster', function ($translate, $uibModal, toaster) {

      var alertType = {
        INFO: 'info',
        ERRO: 'error',
        ALERTA: 'warning',
        SUCESSO: 'success',
        AGUARDE: 'wait'
      };

      var utils = {
        messages: {
          post: {
            title: 'post.title',
            message: 'post.message',
            type: alertType.SUCESSO
          },
          put: {
            title: 'put.title',
            message: 'put.message',
            type: alertType.SUCESSO
          },
          status: {
            title: 'status.title',
            message: 'status.message',
            type: alertType.SUCESSO
          },
          del: {
            title: 'del.title',
            message: 'del.message',
            type: alertType.SUCESSO
          },
          errorQuery: {
            title: 'errorQuery.title',
            message: 'errorQuery.message',
            type: alertType.INFO
          }
        }
      };

      return {
        confirm: confirm,
        showToast: showToast,
        showError: showError,
        showInfo: showInfo,
        showWarning: showWarning,
        showSuccess: showSuccess,
        utils: utils,
        alertType: alertType,
        getMessagesTranslations: getMessagesTranslations
      };

      function confirm(title, message) {
        return $uibModal.open({
          animation: false,
          templateUrl: "view/common/confirm.html",
          controller: ["$uibModalInstance", "itm", function ($uibModalInstance, itm) {
            var vm = this;
            vm.itm = itm;
            vm.no = function () {
              $uibModalInstance.dismiss('cancel');
            }
            vm.yes = function () {
              $uibModalInstance.close(vm.item);
            }
          }],
          controllerAs: 'vm',
          size: 'sm',
          resolve: {
            itm: function () {
              return {
                titulo: title,
                message: message
              };
            }
          }
        }).result;
      }

      function showToast(data) {
        toaster.pop(data.type, data.title, data.message);
      }

      function showError(title, message) {
        showToast({
          title: title,
          message: message,
          type: alertType.ERRO
        });
      }

      function showInfo(title, message) {
        showToast({
          title: title,
          message: message,
          type: alertType.INFO
        });
      }

      function showWarning(title, message) {
        showToast({
          title: title,
          message: message,
          type: alertType.ALERTA
        });
      }

      function showSuccess(title, message) {
        showToast({
          title: title,
          message: message,
          type: alertType.SUCESSO
        });
      }

      function getMessagesTranslations() {
        var messagesKeys = Object.keys(utils.messages);

        angular.forEach(messagesKeys, function (value, key) {
          angular.forEach(Object.keys(utils.messages[value]), function (objId) {
            if (objId !== 'type') {
              $translate(utils.messages[value][objId]).then(function (translation) {
                utils.messages[value][objId] = translation;
              });
            }
          });
        });
      }

    }])
    .run(['twAlert', function (twAlert) {
      twAlert.getMessagesTranslations();
    }]);

})();
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

(function () {
  'use strict';
  angular.module("twjs")
      .factory('CheckAuthInterceptor', ["$q", "$rootScope", function ($q, $rootScope) {
          return {
              responseError: function(error) {
                if (error.status === 401 || error.status === 403) {
                  $rootScope.$emit('logoutAuthSemAcesso');
                }
              }
          };
      }])
      .config(["$httpProvider", function ($httpProvider) {
          $httpProvider.interceptors.push('CheckAuthInterceptor'); //OAuth 2.0
      }]);
})();

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
(function() {
  'use strict';
  angular.module("twjs")
    .factory('twController', ['$rootScope', '$state', '$stateParams', 'twAlert',
      function($rootScope, $state, $stateParams, twAlert) {

        var master = function(obj, svc, $scope) {
          var vm = {};

          var _queried = $rootScope.$on('queried', function(evt, items) {
            vm.items = items;
          });

          $scope.$on('$destroy', _queried);

          var _canceled = $rootScope.$on('canceled', function() {
            if (vm.items && vm.items.length > 0) {
              for (var i = 0; i < vm.items.length; i++)
                vm.items[i].updated = false;

              $state.go('^.grid', {
                items: vm.items
              });
            } else {
              $state.go('^.grid');
            }

          });

          $scope.$on('$destroy', _canceled);

          var _saved = $rootScope.$on('saved', function(evt, pk) {

            if (vm.items && vm.items.length > 0) {
              //VERIFICA SE A PK QUE RETORNOU DA EDIÇÃO EXISTE NA GRID
              var rows = vm.items.filter(function(itm) {
                itm.updated = false;
                for (var i in pk) {
                  if (itm[i] != pk[i])
                    return false;
                }

                return true;
              });

              //BUSCA O REGISTRO DA GRID ATUALIZADO NO SERVIDOR
              svc.getOne(pk)
                .then(function(res) {

                  //POSICIONA O REGISTRO ATUALIZADO NA GRID. SE FOR INCLUSÃO, IRÁ PARA A PRIMEIRA POSIÇÃO

                  var index = (rows.length > 0) ? vm.items.indexOf(rows[0]) : -1;

                  res[0].updated = true;

                  if (index == -1) {
                    vm.items.splice(0, 0, res[0]);
                  } else {
                    vm.items.splice(index, 1, res[0]);
                  }

                  $state.go('^.grid', {
                    items: vm.items
                  });

                });
            } else {
              svc.getOne(pk)
                .then(function(res) {
                  $state.go('^.grid', {
                    items: res
                  });
                });
            }
          });

          $scope.$on('$destroy', _saved);

          obj.__proto__ = vm;

          return obj;

        };

        var grid = function(obj, svc) {
          var vm = {};

          vm.Filter = {};
          vm.debounce = 0;
          vm.searching = false;
          vm.complete = false;
          vm.items = [];
          var pageSize = 20;

          //PESQUISA DA GRID
          vm.search = function(inScroll) {

            if (vm.searching) return;

            vm.searching = true;

            if (!inScroll) {
              vm.page = 0;
              vm.complete = false;
              vm.items = [];
            }
            svc.getAll({
                Config: {
                  Skip: vm.page,
                  Top: pageSize
                },
                Filter: vm.Filter
              })
              .then(function(v) {
                $rootScope.$emit('queried', v);

                vm.items = vm.items.concat(v);

                if (v.length < pageSize)
                  vm.complete = true;

                if (v.length > 0) {
                  vm.page += 1;
                }

                if (obj.loaded)
                  obj.loaded();
              })
              .finally(function() {
                vm.searching = false;
              });
          }


          //INCLUSÃO
          vm.add = function() {
            $state.go('^.form'); //TODO APRESENTAÇÃO ROBSON: Deixar states configuraveis 
          }

          //EDIÇÃO
          vm.edit = function(pk) {
            $state.go('^.form', pk);
          }

          //STATUS ON/OFF
          vm.toggle = function(itm) {
            svc.toggle(itm).then(function(v) {
              itm.Status = v;
            });
          }

          //EXCLUSÃO
          vm.del = function(itm) {
            twAlert.confirm("Exclusão de registro", "Deseja excluir esse registro?").then(function() {
              svc.del(itm).then(function(v) {
                vm.items.splice(vm.items.indexOf(itm), 1);
                twAlert.showSuccess("Exclusão de registro.", "Esse registro foi excluído com sucesso!");
              });
            });
          }


          if ($stateParams.items) {
            vm.items = angular.fromJson(angular.toJson($stateParams.items));
          }

          if ($stateParams.filter) {
            vm.Filter = angular.fromJson($stateParams.filter);
            vm.search();
          }

          obj.__proto__ = vm;

          return obj;

        }

        var form = function(obj, svc) {
          var vm = {};


          var pk = angular.fromJson($stateParams);

          var hasProp = false;
          if (pk != null) {
            for (var _p in pk) {
              if (pk[_p] != "" && pk[_p] != null) {
                hasProp = true;
                break;
              }
            }
          }

          if (!hasProp) {
            vm.action = "INCLUSÃO";
            vm.item = {};
          } else {
            vm.action = "EDIÇÃO";
            vm.loading = true;
            svc.get(pk)
              .then(function(res) {
                vm.item = res;
                if (obj.loaded)
                  obj.loaded();
              }, function(err) {
                vm.cancel();
              })
              .finally(function() {
                vm.loading = false;
              });
          }


          vm.cancel = function() {
            $rootScope.$emit('canceled');
            $state.go('^.grid')
          };

          vm.save = function() {
            vm.loading = true;
            if (!hasProp) {
              svc.post(vm.item)
                .then(function(v) {
                  twAlert.showSuccess("Inclusão de registro", "Operação realizada com sucesso!");
                  $rootScope.$emit('saved', v);
                  $state.go('^.grid');
                })
                .finally(function() {
                  vm.loading = false;
                });
            } else {
              svc.put(vm.item)
                .then(function(v) {
                  twAlert.showSuccess("Atualização de registro", "Operação realizada com sucesso!");
                  $rootScope.$emit('saved', pk);
                  $state.go('^.grid');
                })
                .finally(function() {
                  vm.loading = false;
                });
            }
          }

          obj.__proto__ = vm;

          return obj;
        };

        var instantiate = function(obj) {
          var res = {};

          obj.__proto__ = res;

          return obj;
        };

        return {
          master: master,
          grid: grid,
          form: form,
          instantiate: instantiate
        };
      }
    ]);
})();
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
