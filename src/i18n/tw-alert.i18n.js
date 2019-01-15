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