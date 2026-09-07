'use strict'

var app = require('./app')
var db = require('./db')
var logger = require('./logger')
var config = require('./config')

// 0.0.0.0: em 127.0.0.1 nada de fora do container alcanca.
var server = app.listen(config.port, '0.0.0.0', function () {
  logger.info('legacy-api listening', { port: config.port, runtime: process.version })
})

function shutdown(signal) {
  logger.info('shutting down', { signal: signal })
  server.close(function () {
    // Pool depois do servidor: request em voo ainda precisa do banco.
    db.close().then(function () {
      process.exit(0)
    })
  })
}

process.on('SIGTERM', function () { shutdown('SIGTERM') })
process.on('SIGINT', function () { shutdown('SIGINT') })
