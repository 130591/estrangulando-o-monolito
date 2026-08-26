'use strict';

var app = require('./app');
var logger = require('./logger');

var port = parseInt(process.env.PORT, 10) || 8080;

// 0.0.0.0: em 127.0.0.1 nada de fora do container alcanca.
var server = app.listen(port, '0.0.0.0', function () {
  logger.info('legacy-api listening', { port: port, runtime: process.version });
});

function shutdown(signal) {
  logger.info('shutting down', { signal: signal });
  server.close(function () {
    process.exit(0);
  });
}

process.on('SIGTERM', function () { shutdown('SIGTERM'); });
process.on('SIGINT', function () { shutdown('SIGINT'); });
