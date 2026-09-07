(function () {
  'use strict'

  angular.module('devNotesApp').component('dnBrand', {
    templateUrl: 'components/dn-brand.html',
    bindings: {
      size: '@'
    },
    controller: BrandController,
    controllerAs: 'vm'
  })

  BrandController.$inject = []
  function BrandController() {
    var vm = this

    vm.$onInit = function () {
      vm.cssClass = vm.size ? 'dn-brand dn-brand--' + vm.size : 'dn-brand'
    }
  }
})()
