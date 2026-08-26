'use strict';

var express = require('express');
var requestId = require('./middleware/request-id');
var healthRoutes = require('./routes/health');
var exampleRoutes = require('./routes/example');

var app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(requestId);
app.use(express.json());

app.use('/', healthRoutes);
app.use('/api/example', exampleRoutes);

app.use(function (req, res) {
  res.status(404).json({
    source: 'legacy-api',
    requestId: req.requestId,
    error: 'not_found'
  });
});

// 4 argumentos: e assim que o Express reconhece error handler.
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  req.log.error('unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    source: 'legacy-api',
    requestId: req.requestId,
    error: 'internal_error'
  });
});

module.exports = app;
