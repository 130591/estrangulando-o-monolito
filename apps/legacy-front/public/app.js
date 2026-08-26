(function () {
  'use strict';

  angular
    .module('legacyApp', ['ngRoute'])
    .constant('API_BASE', '/api/example')
    .config(configure)
    .factory('requestIdInterceptor', requestIdInterceptor)
    .config(registerInterceptor);

  configure.$inject = ['$routeProvider', '$locationProvider'];
  function configure($routeProvider, $locationProvider) {
    // URLs sem "#": exige try_files no servidor, senao F5 fora da raiz da 404.
    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html',
        controller: 'HomeController',
        controllerAs: 'vm'
      })
      .when('/items', {
        templateUrl: 'views/items.html',
        controller: 'ItemsController',
        controllerAs: 'vm'
      })
      .otherwise({ redirectTo: '/' });
  }

  requestIdInterceptor.$inject = [];
  function requestIdInterceptor() {
    return {
      request: function (config) {
        config.headers['x-request-id'] = uuidv4();
        return config;
      }
    };

    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  }

  registerInterceptor.$inject = ['$httpProvider'];
  function registerInterceptor($httpProvider) {
    $httpProvider.interceptors.push('requestIdInterceptor');
  }
})();
