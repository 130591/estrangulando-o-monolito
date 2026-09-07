(function () {
  'use strict'

  angular.module('devNotesApp').factory('session', sessionFactory)

  // A MESMA chave que o new-front usa. Servidos pela borda os dois estao na
  // mesma origem, entao a sessao atravessa o corte.
  var TOKEN_KEY = 'devnotes.token'

  sessionFactory.$inject = ['$q', 'api']
  function sessionFactory($q, api) {
    var state = {
      token: read(),
      user: null,
      via: null,
      returnTo: null
    }

    return {
      isAuthenticated: isAuthenticated,
      token: function () { return state.token },
      user: function () { return state.user },
      via: function () { return state.via },
      hydrate: hydrate,
      login: login,
      register: register,
      logout: logout,
      setReturnTo: setReturnTo,
      takeReturnTo: takeReturnTo
    }

    function isAuthenticated() {
      return Boolean(state.token)
    }

    // Confirma no boot que o token guardado ainda vale. Se nao valer, limpa -
    // melhor cair no login do que quebrar o dashboard inteiro em 401.
    function hydrate() {
      if (!state.token) return $q.resolve(null)
      if (state.user) return $q.resolve(state.user)

      return api.get('/auth/me').then(function (body) {
        state.user = body.user
        state.via = body.via || null
        return state.user
      }, function (error) {
        if (error.status === 401) clear()
        return null
      })
    }

    function login(credentials) {
      return api.post('/auth/login', credentials).then(accept)
    }

    function register(payload) {
      return api.post('/auth/register', payload).then(accept)
    }

    function accept(body) {
      state.token = body.token
      state.user = body.user
      state.via = null
      write(body.token)
      return body.user
    }

    function logout() {
      clear()
    }

    function clear() {
      state.token = null
      state.user = null
      state.via = null
      write(null)
    }

    function setReturnTo(path) {
      state.returnTo = path
    }

    function takeReturnTo() {
      var path = state.returnTo || '/notas'
      state.returnTo = null
      return path
    }

    // localStorage pode lancar (aba anonima, storage bloqueado): sem o
    // try/catch o app inteiro morreria no boot por uma preferencia do browser.
    function read() {
      try {
        return window.localStorage.getItem(TOKEN_KEY)
      } catch (err) {
        return null
      }
    }

    function write(token) {
      try {
        if (token) window.localStorage.setItem(TOKEN_KEY, token)
        else window.localStorage.removeItem(TOKEN_KEY)
      } catch (err) {
        // Sessao so em memoria: some no refresh, mas o app funciona.
      }
    }
  }
})()
