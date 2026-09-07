'use strict'

var jwt = require('jsonwebtoken')
var config = require('./../config')

var SERVICE = 'legacy-api'

// HS256 e `iss`/`aud` fixos, iguais aos do new-service: e o que faz o token
// sobreviver ao desvio de rota. `via` so registra quem emitiu.
function sign(user) {
  return jwt.sign(
    {
      email: user.email,
      username: user.username,
      name: user.name,
      via: SERVICE
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      subject: String(user.id),
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    }
  )
}

function verify(token) {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  })
}

module.exports = { sign: sign, verify: verify, SERVICE: SERVICE }
