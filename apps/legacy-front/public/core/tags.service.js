(function () {
  'use strict'

  angular.module('devNotesApp').factory('tags', tagsFactory)

  tagsFactory.$inject = ['api']
  function tagsFactory(api) {
    return {
      list: list,
      create: create
    }

    function list() {
      return api.get('/tags').then(function (body) {
        return body.tags
      })
    }

    function create(name) {
      return api.post('/tags', { name: name }).then(function (body) {
        return body.tag
      })
    }
  }
})()
