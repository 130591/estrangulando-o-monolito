'use strict'

var express = require('express')

var mappers = require('../lib/mappers')
var route = require('../lib/route')
var tagsLib = require('../lib/tags')
var v = require('../lib/validate')
var auth = require('../middleware/auth')

var router = express.Router()

router.use(auth.requireAuth)

router.get('/', route.wrap(function (req, res) {
  return tagsLib.listFor(req.user.id).then(function (rows) {
    res.json(route.envelope(req, { tags: rows.map(mappers.toTag) }))
  })
}))

router.post('/', route.wrap(function (req, res) {
  var name = v.text((req.body || {}).name, 'tag', { required: true, max: 40 })

  return tagsLib.resolveByName(req.user.id, name).then(function (row) {
    res.status(201).json(route.envelope(req, { tag: mappers.toTag(row) }))
  })
}))

module.exports = router
