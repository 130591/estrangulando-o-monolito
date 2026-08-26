(function () {
  'use strict';

  angular.module('legacyApp').controller('ItemsController', ItemsController);

  ItemsController.$inject = ['$http', 'API_BASE'];
  function ItemsController($http, API_BASE) {
    var vm = this;
    vm.items = [];

    $http.get(API_BASE + '/items').then(function (res) {
      vm.items = res.data.items;
      vm.source = res.data.source;
    }, function () {
      vm.error = 'nao foi possivel carregar os items';
    });
  }
})();
