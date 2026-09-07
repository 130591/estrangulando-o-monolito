'use strict'

var express = require('express')
var requestId = require('./middleware/request-id')
var route = require('./lib/route')
var healthRoutes = require('./routes/health')
var exampleRoutes = require('./routes/example')
var authRoutes = require('./routes/auth')
var notesRoutes = require('./routes/notes')
var tagsRoutes = require('./routes/tags')
var profileRoutes = require('./routes/profiles')

var app = express()

app.set('trust proxy', true)
app.disable('x-powered-by')

app.use(requestId)
app.use(express.json({ limit: '64kb' }))

app.use('/', healthRoutes)

// Sonda de ownership de rota do repo: nao serve o Dev Notes, prova quem atendeu.
app.use('/api/example', exampleRoutes)

// Cada prefixo e uma unidade de estrangulamento: a borda pode mover /api/notes
// sem levar /api/auth junto.
app.use('/api/auth', authRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/profiles', profileRoutes)

app.use(function (req, res) {
  res.status(404).json(route.envelope(req, { error: 'not_found' }))
})

// 4 argumentos: e assim que o Express reconhece error handler.
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  // HttpError e erro previsto e vira resposta com a mensagem. Qualquer outra
  // coisa e bug ou banco fora, e nao vaza detalhe.
  if (err.expose && err.status) {
    req.log.warn('request rejeitada', { status: err.status, code: err.code, path: req.originalUrl })
    return res.status(err.status).json(route.envelope(req, { error: err.code, message: err.message }))
  }

  req.log.error('unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json(route.envelope(req, { error: 'internal_error' }))
})

module.exports = app
