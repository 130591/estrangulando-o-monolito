'use strict'

var errors = require('../lib/errors')
var tokens = require('../lib/tokens')

// Bearer no header e nao cookie: o token precisa viajar para /api/** mesmo
// quando quem responde e o outro backend.
function readToken(req) {
  var header = req.headers.authorization
  if (!header) return null
  var parts = String(header).split(' ')
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) return null
  return parts[1]
}

function claimsToUser(claims) {
  return {
    id: String(claims.sub),
    email: claims.email,
    username: claims.username,
    name: claims.name,
    via: claims.via
  }
}

// Nao consulta o banco: o `sub` do token ja e a chave que as queries usam.
function requireAuth(req, res, next) {
  var token = readToken(req)
  if (!token) return next(errors.unauthorized('sem_token', 'autenticacao obrigatoria'))

  try {
    req.user = claimsToUser(tokens.verify(token))
  } catch (err) {
    var expired = err.name === 'TokenExpiredError'
    return next(errors.unauthorized(expired ? 'token_expirado' : 'token_invalido', 'sessao invalida'))
  }

  next()
}

// Para rotas publicas que mudam de forma quando ha sessao: o perfil abre para
// qualquer visitante, mas o dono ve outro cabecalho.
function optionalAuth(req, res, next) {
  var token = readToken(req)
  if (token) {
    try {
      req.user = claimsToUser(tokens.verify(token))
    } catch (err) {
      req.user = null
    }
  }
  next()
}

module.exports = { requireAuth: requireAuth, optionalAuth: optionalAuth }
