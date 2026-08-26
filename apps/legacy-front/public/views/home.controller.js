(function () {
  'use strict';

  angular.module('legacyApp').controller('HomeController', HomeController);

  HomeController.$inject = ['$http', 'API_BASE'];
  function HomeController($http, API_BASE) {
    var vm = this;

    $http.get(API_BASE + '/status').then(function (res) {
      vm.source = res.data.source;
      vm.runtime = res.data.runtime;
    }, function () {
      vm.error = 'legacy-api indisponivel';
    });
  }
})();
