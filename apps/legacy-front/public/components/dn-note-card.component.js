(function () {
  'use strict'

  // So apresenta: quem decide o que abrir e o dashboard, via onSelect.
  angular.module('devNotesApp').component('dnNoteCard', {
    templateUrl: 'components/dn-note-card.html',
    bindings: {
      note: '<',
      onSelect: '&'
    },
    controller: NoteCardController,
    controllerAs: 'vm'
  })

  NoteCardController.$inject = ['format']
  function NoteCardController(format) {
    var vm = this

    // $onChanges e nao $onInit: a nota e recalculada quando o filtro muda.
    vm.$onChanges = function () {
      if (!vm.note) return
      vm.dateLabel = format.dateLabel(vm.note.createdAt)
      vm.visibilityLabel = format.visibilityLabel(vm.note.visibility)
      vm.tagStyle = format.tagStyle(vm.note.tag)
    }

    vm.select = function () {
      vm.onSelect({ note: vm.note })
    }
  }
})()
