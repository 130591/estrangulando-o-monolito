(function () {
  'use strict'

  angular
    .module('devNotesApp', ['ngRoute'])
    .constant('API_BASE', '/api')
    .constant('SHOWCASE_USERNAME', 'mariana')
    .config(configureRoutes)
    .config(registerInterceptor)
    .run(guardRoutes)

  configureRoutes.$inject = ['$routeProvider', '$locationProvider']
  function configureRoutes($routeProvider, $locationProvider) {
    // URLs sem "#": exige try_files no servidor, senao F5 fora da raiz da 404.
    $locationProvider.html5Mode(true)

    $routeProvider
      .when('/', {
        templateUrl: 'views/landing.html',
        controller: 'LandingController',
        controllerAs: 'vm'
      })
      .when('/entrar', {
        templateUrl: 'views/auth.html',
        controller: 'AuthController',
        controllerAs: 'vm'
      })
      .when('/notas', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardController',
        controllerAs: 'vm',
        requiresAuth: true,
        archived: false,
        resolve: { currentUser: resolveCurrentUser }
      })
      .when('/arquivadas', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardController',
        controllerAs: 'vm',
        requiresAuth: true,
        archived: true,
        resolve: { currentUser: resolveCurrentUser }
      })
      // Por ultimo: o ngRoute casa na ordem de registro, entao /notas viraria
      // perfil se esta rota viesse antes. A lista de reservados fecha o resto.
      .when('/:username', {
        templateUrl: 'views/profile.html',
        controller: 'ProfileController',
        controllerAs: 'vm'
      })
      .otherwise({ redirectTo: '/' })
  }

  // Resolve antes do template: sem isso o cabecalho pisca com /undefined
  // enquanto o /auth/me nao volta.
  resolveCurrentUser.$inject = ['$q', 'session']
  function resolveCurrentUser($q, session) {
    return session.hydrate().then(function (user) {
      return user || $q.reject('sessao_invalida')
    })
  }

  registerInterceptor.$inject = ['$httpProvider']
  function registerInterceptor($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor')
  }

  // Barrar no $routeChangeStart evita o flash do dashboard vazio para quem nao
  // esta logado.
  guardRoutes.$inject = ['$rootScope', '$location', 'session']
  function guardRoutes($rootScope, $location, session) {
    $rootScope.$on('$routeChangeStart', function (event, next) {
      if (!next || !next.$$route || !next.$$route.requiresAuth) return
      if (session.isAuthenticated()) return

      event.preventDefault()
      session.setReturnTo($location.path())
      $location.path('/entrar')
    })

    $rootScope.$on('$routeChangeError', function () {
      session.logout()
      $location.path('/entrar')
    })
  }
})()
