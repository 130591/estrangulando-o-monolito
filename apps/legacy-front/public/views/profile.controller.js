(function () {
  'use strict'

  angular.module('devNotesApp').controller('ProfileController', ProfileController)

  ProfileController.$inject = ['$routeParams', '$location', '$timeout', '$window', 'profiles', 'session', 'format']
  function ProfileController($routeParams, $location, $timeout, $window, profiles, session, format) {
    var vm = this

    vm.username = $routeParams.username
    vm.loading = true
    vm.notFound = false
    vm.copied = false
    vm.profile = null
    vm.notes = []
    vm.isOwner = false
    vm.isAuthenticated = session.isAuthenticated()

    // O handle e o endereco real desta pagina, nao um rotulo.
    vm.handle = $window.location.host + '/' + vm.username

    profiles.byUsername(vm.username).then(function (body) {
      vm.profile = body.profile
      vm.notes = body.notes
      vm.isOwner = body.isOwner
      vm.stats = body.stats
      vm.since = format.monthLabel(body.stats.memberSince)
    }, function (error) {
      vm.notFound = error.status === 404
      vm.error = error.message
    })['finally'](function () {
      vm.loading = false
    })

    vm.dateLabel = format.dateLabel
    vm.tagStyle = format.tagStyle

    vm.enter = function () {
      $location.path(vm.isAuthenticated ? '/notas' : '/entrar')
    }

    vm.copyLink = function () {
      copy($window.location.origin + '/' + vm.username).then(function () {
        vm.copied = true
        $timeout(function () { vm.copied = false }, 1600)
      })
    }

    // navigator.clipboard so existe em contexto seguro (https ou localhost):
    // fora dele o fallback e o textarea + execCommand.
    function copy(text) {
      if ($window.navigator.clipboard && $window.isSecureContext) {
        return $window.navigator.clipboard.writeText(text)
      }

      var area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()

      try {
        document.execCommand('copy')
      } catch (err) {
        // Sem clipboard: o botao nao pisca, mas nada quebra.
      }

      document.body.removeChild(area)
      return $timeout(angular.noop, 0)
    }
  }
})()
