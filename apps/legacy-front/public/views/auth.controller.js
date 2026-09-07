(function () {
  'use strict'

  angular.module('devNotesApp').controller('AuthController', AuthController)

  AuthController.$inject = ['$location', 'session']
  function AuthController($location, session) {
    var vm = this

    var search = $location.search()

    // "criar" chega da landing quando a pessoa digitou o e-mail la.
    vm.mode = search.modo === 'criar' ? 'register' : 'login'
    vm.saving = false
    vm.error = null

    vm.form = {
      email: search.email || '',
      password: '',
      name: '',
      username: ''
    }

    vm.isRegister = function () {
      return vm.mode === 'register'
    }

    vm.switchMode = function () {
      vm.mode = vm.isRegister() ? 'login' : 'register'
      vm.error = null
    }

    vm.submit = function () {
      if (vm.saving) return

      vm.saving = true
      vm.error = null

      var action = vm.isRegister()
        ? session.register({
            email: vm.form.email,
            password: vm.form.password,
            name: vm.form.name,
            username: vm.form.username
          })
        : session.login({ email: vm.form.email, password: vm.form.password })

      action.then(function () {
        $location.path(session.takeReturnTo()).search({})
      }, function (error) {
        vm.error = error.message
      })['finally'](function () {
        // ['finally'] e nao .finally: `finally` e palavra reservada no ES3.
        vm.saving = false
      })
    }
  }
})()
