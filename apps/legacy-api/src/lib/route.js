'use strict'

var SOURCE = 'legacy-api'

// `source` prova no navegador qual backend atendeu depois que a borda desvia.
function envelope(req, payload) {
  var body = { source: SOURCE, requestId: req.requestId }
  Object.keys(payload || {}).forEach(function (key) {
    body[key] = payload[key]
  })
  return body
}

// Express 4 nao entende promise rejeitada devolvida pelo handler: sem este
// wrap, um erro no banco viraria request pendurada em vez de 500.
function wrap(handler) {
  return function (req, res, next) {
    try {
      Promise.resolve(handler(req, res, next)).catch(next)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = { SOURCE: SOURCE, envelope: envelope, wrap: wrap }
