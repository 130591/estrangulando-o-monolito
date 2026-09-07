(function () {
  'use strict'

  // Usado para criar E para editar: o que muda e o titulo, o texto do botao e
  // as acoes destrutivas no rodape.
  angular.module('devNotesApp').component('dnNoteModal', {
    templateUrl: 'components/dn-note-modal.html',
    bindings: {
      note: '<',
      tags: '<',
      saving: '<',
      error: '<',
      onSave: '&',
      onClose: '&',
      onArchive: '&',
      onDelete: '&'
    },
    controller: NoteModalController,
    controllerAs: 'vm'
  })

  NoteModalController.$inject = ['$document', '$scope', 'format']
  function NoteModalController($document, $scope, format) {
    var vm = this

    vm.$onInit = function () {
      $document.on('keydown', onKeydown)
    }

    vm.$onDestroy = function () {
      $document.off('keydown', onKeydown)
    }

    // O form e uma copia: editar direto em vm.note deixaria o card da grade
    // mudando enquanto se digita, e Cancelar nao teria o que desfazer.
    vm.$onChanges = function (changes) {
      if (changes.note) resetForm()
      if (changes.tags) vm.tagList = vm.tags || []
    }

    vm.isEdit = function () {
      return Boolean(vm.note && vm.note.id)
    }

    vm.selectTag = function (name) {
      vm.form.tag = name
      vm.form.newTag = ''
    }

    vm.tagOptionStyle = function (tag) {
      return format.tagOptionStyle(tag, vm.form.tag === tag.name && !vm.form.newTag)
    }

    vm.toggleVisibility = function () {
      vm.form.visibility = vm.form.visibility === 'public' ? 'private' : 'public'
    }

    vm.visibilityLabel = function () {
      return format.visibilityLabel(vm.form.visibility)
    }

    vm.submit = function () {
      if (vm.saving) return

      vm.onSave({
        payload: {
          url: vm.form.url,
          title: vm.form.title,
          note: vm.form.note,
          // A tag nova tem prioridade: as duas preenchem o mesmo campo.
          tag: (vm.form.newTag || '').trim() || vm.form.tag || '',
          visibility: vm.form.visibility
        }
      })
    }

    function resetForm() {
      var note = vm.note || {}

      vm.form = {
        url: note.url || '',
        title: note.title || '',
        note: note.note || '',
        tag: note.tag ? note.tag.name : '',
        newTag: '',
        visibility: note.visibility || 'public'
      }
    }

    function onKeydown(event) {
      if (event.key !== 'Escape' && event.keyCode !== 27) return
      vm.onClose()
      $scope.$applyAsync()
    }
  }
})()
