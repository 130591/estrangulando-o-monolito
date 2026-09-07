'use strict'

// Sem libs: os loggers atuais do npm assumem sintaxe que o Node 9 nao entende.
// `severity` e o campo que o Cloud Logging le em JSON no stdout.
var SEVERITY = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR'
}

var SERVICE = 'legacy-api'

function write(level, message, fields) {
  var entry = {
    severity: SEVERITY[level] || 'DEFAULT',
    time: new Date().toISOString(),
    service: SERVICE,
    message: message
  }

  if (fields) {
    Object.keys(fields).forEach(function (key) {
      entry[key] = fields[key]
    })
  }

  process.stdout.write(JSON.stringify(entry) + '\n')
}

function make(level) {
  return function (message, fields) {
    write(level, message, fields)
  }
}

var logger = {
  debug: make('debug'),
  info: make('info'),
  warn: make('warn'),
  error: make('error')
}

logger.child = function (bound) {
  var child = {}
  ;['debug', 'info', 'warn', 'error'].forEach(function (level) {
    child[level] = function (message, fields) {
      var merged = {}
      Object.keys(bound).forEach(function (k) { merged[k] = bound[k] })
      if (fields) {
        Object.keys(fields).forEach(function (k) { merged[k] = fields[k] })
      }
      write(level, message, merged)
    }
  })
  return child
}

module.exports = logger
