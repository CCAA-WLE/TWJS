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