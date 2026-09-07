(function () {
  'use strict'

  angular.module('devNotesApp').factory('authInterceptor', authInterceptor)

  // `session` NAO entra no $inject: session depende de api, api depende de
  // $http, e $http instancia este interceptor - a injecao direta fecharia um
  // ciclo. $injector.get() no momento da chamada quebra o ciclo.
  authInterceptor.$inject = ['$q', '$injector', 'API_BASE']
  function authInterceptor($q, $injector, API_BASE) {
    return {
      request: onRequest,
      responseError: onResponseError
    }

    function onRequest(config) {
      config.headers = config.headers || {}
      config.headers['x-request-id'] = uuidv4()

      var token = $injector.get('session').token()
      if (token && isOurApi(config.url)) {
        config.headers.Authorization = 'Bearer ' + token
      }

      return config
    }

    function onResponseError(response) {
      // 401 em /auth/login e credencial errada, nao sessao expirada: quem trata
      // e o formulario.
      var url = response.config && response.config.url
      if (response.status === 401 && isOurApi(url) && !isAuthRoute(url)) {
        $injector.get('session').logout()
        $injector.get('$location').path('/entrar')
      }

      return $q.reject(response)
    }

    function isOurApi(url) {
      return typeof url === 'string' && url.indexOf(API_BASE + '/') === 0
    }

    function isAuthRoute(url) {
      return url.indexOf(API_BASE + '/auth/login') === 0 ||
        url.indexOf(API_BASE + '/auth/register') === 0
    }

    // crypto.randomUUID() nao existe nos navegadores da epoca deste front.
    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0
        var v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
  }
})()
