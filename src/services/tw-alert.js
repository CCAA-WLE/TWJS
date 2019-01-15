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
          controller: function ($uibModalInstance, itm) {
            var vm = this;
            vm.itm = itm;
            vm.no = function () {
              $uibModalInstance.dismiss('cancel');
            }
            vm.yes = function () {
              $uibModalInstance.close(vm.item);
            }
          },
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