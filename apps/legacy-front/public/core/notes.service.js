(function () {
  'use strict'

  angular.module('devNotesApp').factory('notes', notesFactory)

  notesFactory.$inject = ['api']
  function notesFactory(api) {
    return {
      list: list,
      create: create,
      update: update,
      remove: remove
    }

    // Devolve a lista filtrada E os contadores do acervo inteiro, para o
    // cabecalho nao mudar quando um filtro e aplicado.
    function list(options) {
      var opts = options || {}
      var params = {}

      if (opts.query) params.q = opts.query
      if (opts.tag && opts.tag !== 'Tudo') params.tag = opts.tag
      if (opts.archived) params.archived = '1'

      return api.get('/notes', null, params)
    }

    function create(payload) {
      return api.post('/notes', payload).then(pluck)
    }

    function update(id, patch) {
      return api.patch('/notes/' + id, patch).then(pluck)
    }

    function remove(id) {
      return api.del('/notes/' + id)
    }

    function pluck(body) {
      return body.note
    }
  }
})()
