(function () {
  'use strict'

  angular.module('devNotesApp').factory('api', apiFactory)

  apiFactory.$inject = ['$http', '$q', 'API_BASE']
  function apiFactory($http, $q, API_BASE) {
    var service = {
      get: request('GET'),
      post: request('POST'),
      patch: request('PATCH'),
      del: request('DELETE'),
      // Qual backend atendeu a ultima chamada: a borda pode ter desviado a rota.
      lastSource: null
    }

    return service

    function request(method) {
      return function (path, payload, params) {
        var config = { method: method, url: API_BASE + path, params: params }
        if (payload) config.data = payload

        return $http(config).then(unwrap, fail)
      }
    }

    function unwrap(response) {
      if (response.data && response.data.source) {
        service.lastSource = response.data.source
      }
      return response.data
    }

    function fail(response) {
      var body = response.data || {}
      return $q.reject({
        status: response.status,
        code: body.error || 'erro_desconhecido',
        message: body.message || mensagemPadrao(response.status)
      })
    }

    function mensagemPadrao(status) {
      if (status <= 0) return 'servidor fora do ar'
      if (status === 401) return 'sessao expirada'
      if (status === 404) return 'nao encontrado'
      return 'algo deu errado (' + status + ')'
    }
  }
})()
