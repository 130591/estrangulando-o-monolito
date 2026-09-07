(function () {
  'use strict'

  angular.module('devNotesApp').controller('DashboardController', DashboardController)

  var ALL = 'Tudo'

  DashboardController.$inject = ['$route', '$location', 'currentUser', 'session', 'notes', 'tags', 'format']
  function DashboardController($route, $location, currentUser, session, notes, tags, format) {
    var vm = this

    // /notas e /arquivadas sao a mesma tela com um flag diferente na rota.
    vm.archived = Boolean($route.current.$$route.archived)
    vm.active = vm.archived ? 'arquivadas' : 'notas'
    vm.title = vm.archived ? 'Arquivadas' : 'Minhas notas'

    vm.user = currentUser
    vm.via = session.via()
    vm.loading = true
    vm.error = null
    vm.notes = []
    vm.tagList = []
    vm.filters = [ALL]
    vm.filter = ALL
    vm.query = ''
    vm.countLabel = ''

    vm.modal = { open: false, note: null, saving: false, error: null }

    loadTags()
    reload()

    vm.reload = reload

    vm.setFilter = function (name) {
      vm.filter = name
      reload()
    }

    vm.isFilterActive = function (name) {
      return vm.filter === name
    }

    vm.openCreate = function () {
      vm.modal = { open: true, note: null, saving: false, error: null }
    }

    vm.openNote = function (note) {
      vm.modal = { open: true, note: note, saving: false, error: null }
    }

    vm.closeModal = function () {
      vm.modal.open = false
    }

    vm.save = function (payload) {
      var current = vm.modal.note
      vm.modal.saving = true
      vm.modal.error = null

      var action = current && current.id ? notes.update(current.id, payload) : notes.create(payload)

      action.then(function () {
        vm.modal.open = false
        // Recarrega em vez de mexer na lista na mao: filtro, busca e contadores
        // mudam junto, e reconciliar tudo aqui daria divergencia.
        reload()
        loadTags()
      }, function (error) {
        vm.modal.error = error.message
      })['finally'](function () {
        vm.modal.saving = false
      })
    }

    vm.toggleArchive = function () {
      var note = vm.modal.note
      if (!note) return

      notes.update(note.id, { archived: !note.archived }).then(function () {
        vm.modal.open = false
        reload()
      }, function (error) {
        vm.modal.error = error.message
      })
    }

    vm.remove = function () {
      var note = vm.modal.note
      if (!note) return
      if (!window.confirm('Excluir "' + note.title + '"? Isso não tem volta.')) return

      notes.remove(note.id).then(function () {
        vm.modal.open = false
        reload()
      }, function (error) {
        vm.modal.error = error.message
      })
    }

    vm.logout = function () {
      session.logout()
      $location.path('/')
    }

    function loadTags() {
      return tags.list().then(function (list) {
        vm.tagList = list
        vm.filters = [ALL].concat(list.map(nameOf))
      }, angular.noop)
    }

    function reload() {
      vm.loading = true
      vm.error = null

      notes.list({ query: vm.query, tag: vm.filter, archived: vm.archived })
        .then(function (body) {
          vm.notes = body.notes
          vm.stats = body.stats
          vm.countLabel = format.countLabel(body.stats)
        }, function (error) {
          vm.error = error.message
          vm.notes = []
        })['finally'](function () {
          vm.loading = false
        })
    }

    function nameOf(tag) {
      return tag.name
    }
  }
})()
