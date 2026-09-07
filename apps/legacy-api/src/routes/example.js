'use strict'

var express = require('express')
var router = express.Router()

// `source` prova quem atendeu a rota quando a borda desvia parte do trafego.
var SOURCE = 'legacy-api'

var items = [
  { id: '1', name: 'example-one' },
  { id: '2', name: 'example-two' }
]

router.get('/items', function (req, res) {
  res.json({ source: SOURCE, requestId: req.requestId, items: items })
})

router.get('/items/:id', function (req, res) {
  var found = items.filter(function (item) {
    return item.id === req.params.id
  })[0]

  if (!found) {
    return res.status(404).json({
      source: SOURCE,
      requestId: req.requestId,
      error: 'not_found'
    })
  }

  res.json({ source: SOURCE, requestId: req.requestId, item: found })
})

router.get('/status', function (req, res) {
  res.json({
    source: SOURCE,
    requestId: req.requestId,
    runtime: process.version,
    migrated: false
  })
})

module.exports = router
