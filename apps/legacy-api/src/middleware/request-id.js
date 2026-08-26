'use strict';

var crypto = require('crypto');
var logger = require('../logger');

var HEADER = 'x-request-id';

// crypto.randomUUID() so existe a partir do Node 14.17.
function uuidv4() {
  var bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  var hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

// Reaproveita o id que veio da borda; senao gera. E ele que correlaciona os
// dois lados da migracao.
module.exports = function requestId(req, res, next) {
  var incoming = req.headers[HEADER];
  req.requestId = incoming ? String(incoming) : uuidv4();
  req.log = logger.child({ requestId: req.requestId });

  res.setHeader(HEADER, req.requestId);

  var startedAt = Date.now();
  res.on('finish', function () {
    req.log.info('request completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
};
