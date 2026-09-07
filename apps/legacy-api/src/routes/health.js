'use strict'

var express = require('express')
var db = require('../db')
var router = express.Router()

var startedAt = Date.now()

// Liveness: nao checa dependencia externa - se checasse, uma dependencia fora
// do ar reiniciaria o container em vez de so tira-lo do balanceamento.
router.get('/healthz', function (req, res) {
  res.json({
    status: 'ok',
    service: 'legacy-api',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
  })
})

// Readiness: aqui o banco entra. Sem MySQL nenhuma rota do Dev Notes responde,
// entao a instancia sai do balanceamento - e nao morre.
router.get('/readyz', function (req, res) {
  db.ping()
    .then(function () {
      res.json({ status: 'ready', service: 'legacy-api', checks: { self: 'ok', mysql: 'ok' } })
    })
    .catch(function (err) {
      req.log.warn('readyz falhou', { error: err.message })
      res.status(503).json({
        status: 'not-ready',
        service: 'legacy-api',
        checks: { self: 'ok', mysql: 'down' }
      })
    })
})

module.exports = router
