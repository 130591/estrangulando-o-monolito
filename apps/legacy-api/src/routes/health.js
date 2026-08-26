'use strict';

var express = require('express');
var router = express.Router();

var startedAt = Date.now();

// Liveness: nao checa dependencia externa - se checasse, uma dependencia fora
// do ar reiniciaria o container em vez de so tira-lo do balanceamento.
router.get('/healthz', function (req, res) {
  res.json({
    status: 'ok',
    service: 'legacy-api',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
  });
});

router.get('/readyz', function (req, res) {
  var checks = {
    self: 'ok'
  };

  var ready = Object.keys(checks).every(function (key) {
    return checks[key] === 'ok';
  });

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    service: 'legacy-api',
    checks: checks
  });
});

module.exports = router;
