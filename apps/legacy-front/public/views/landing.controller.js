(function () {
  'use strict'

  angular.module('devNotesApp').controller('LandingController', LandingController)

  LandingController.$inject = ['$location', 'session', 'profiles', 'SHOWCASE_USERNAME']
  function LandingController($location, session, profiles, SHOWCASE_USERNAME) {
    var vm = this

    vm.email = ''
    vm.preview = []
    vm.showcase = SHOWCASE_USERNAME
    vm.isAuthenticated = session.isAuthenticated()

    // A vitrine nao e mock: sao as notas publicas de um perfil de verdade.
    profiles.byUsername(SHOWCASE_USERNAME).then(function (body) {
      vm.preview = (body.notes || []).slice(0, 3)
    }, function () {
      vm.preview = []
    })

    // O e-mail digitado aqui atravessa para o cadastro em vez de ser perdido.
    vm.start = function () {
      $location.path('/entrar').search(vm.email ? { email: vm.email, modo: 'criar' } : {})
    }

    vm.enter = function () {
      $location.path(vm.isAuthenticated ? '/notas' : '/entrar')
    }
  }
})()
