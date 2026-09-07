(function () {
  'use strict'

  angular.module('devNotesApp').factory('profiles', profilesFactory)

  profilesFactory.$inject = ['api']
  function profilesFactory(api) {
    return {
      byUsername: function (username) {
        return api.get('/profiles/' + encodeURIComponent(username))
      }
    }
  }
})()
