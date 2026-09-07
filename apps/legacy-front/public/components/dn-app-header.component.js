(function () {
  'use strict'

  // O menu da conta nao existe no design, mas sair precisa de um lugar.
  angular.module('devNotesApp').component('dnAppHeader', {
    templateUrl: 'components/dn-app-header.html',
    bindings: {
      user: '<',
      via: '<',
      active: '@',
      onAdd: '&',
      onLogout: '&'
    },
    controller: AppHeaderController,
    controllerAs: 'vm'
  })

  AppHeaderController.$inject = ['$document', '$scope']
  function AppHeaderController($document, $scope) {
    var vm = this

    vm.menuOpen = false

    vm.$onInit = function () {
      $document.on('click', closeOnOutsideClick)
    }

    // Sem o off() o listener sobrevive a troca de rota e vaza um por navegacao.
    vm.$onDestroy = function () {
      $document.off('click', closeOnOutsideClick)
    }

    vm.toggleMenu = function ($event) {
      $event.stopPropagation()
      vm.menuOpen = !vm.menuOpen
    }

    vm.logout = function () {
      vm.menuOpen = false
      vm.onLogout()
    }

    // O clique vem de fora do Angular: sem $applyAsync a UI so fecharia no
    // proximo digest.
    function closeOnOutsideClick() {
      if (!vm.menuOpen) return
      vm.menuOpen = false
      $scope.$applyAsync()
    }
  }
})()
