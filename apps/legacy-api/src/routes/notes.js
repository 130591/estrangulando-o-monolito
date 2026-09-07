'use strict'

var express = require('express')

var db = require('../db')
var errors = require('../lib/errors')
var link = require('../lib/link')
var mappers = require('../lib/mappers')
var route = require('../lib/route')
var tagsLib = require('../lib/tags')
var v = require('../lib/validate')
var auth = require('../middleware/auth')

var router = express.Router()

// A tag vem no mesmo SELECT: o card precisa de nome e hue para pintar a pill, e
// N+1 numa grade de seis seria absurdo.
var SELECT_NOTE =
  'SELECT n.*, t.name AS tag_name, t.hue AS tag_hue ' +
  'FROM notes n LEFT JOIN tags t ON t.id = n.tag_id '

var VISIBILITIES = ['public', 'private']

router.use(auth.requireAuth)

function findOwned(userId, noteId) {
  return db.queryOne(SELECT_NOTE + 'WHERE n.id = ? AND n.user_id = ?', [noteId, userId])
    .then(function (row) {
      // 404 e nao 403 para nota de outro dono: um 403 confirmaria que o id existe.
      if (!row) throw errors.notFound('nota_nao_encontrada', 'nota nao encontrada')
      return row
    })
}

// Os contadores do cabecalho sao sobre o acervo inteiro, nao sobre o resultado
// filtrado - por isso query separada.
function statsFor(userId) {
  return db.queryOne(
    'SELECT ' +
    '  COUNT(*)                                             AS total, ' +
    '  SUM(visibility = \'public\' AND archived_at IS NULL) AS publicCount, ' +
    '  SUM(archived_at IS NOT NULL)                         AS archived ' +
    'FROM notes WHERE user_id = ?',
    [userId]
  ).then(function (row) {
    return {
      total: Number(row.total) || 0,
      publicCount: Number(row.publicCount) || 0,
      archived: Number(row.archived) || 0
    }
  })
}

router.get('/', route.wrap(function (req, res) {
  var query = req.query || {}
  var search = v.text(query.q, 'busca', { max: 80 })
  var tag = v.text(query.tag, 'tag', { max: 40 })
  var archived = query.archived === '1' || query.archived === 'true'

  var sql = SELECT_NOTE + 'WHERE n.user_id = ? AND n.archived_at IS ' + (archived ? 'NOT NULL' : 'NULL')
  var params = [req.user.id]

  if (tag) {
    sql += ' AND t.name = ?'
    params.push(tag)
  }

  if (search) {
    sql += ' AND (n.title LIKE ? OR t.name LIKE ?)'
    params.push('%' + search + '%', '%' + search + '%')
  }

  sql += ' ORDER BY n.created_at DESC, n.id DESC LIMIT 200'

  return Promise.all([db.query(sql, params), statsFor(req.user.id)])
    .then(function (results) {
      res.json(route.envelope(req, {
        notes: results[0].map(mappers.toNote),
        stats: results[1]
      }))
    })
}))

router.post('/', route.wrap(function (req, res) {
  var body = req.body || {}
  var url = v.optionalUrl(body.url)
  var described = link.describe(url)

  var payload = {
    url: url,
    title: v.text(body.title, 'titulo', { max: 200 }) || 'Nota sem título',
    note: v.text(body.note, 'anotacao', { max: 500, nullable: true }),
    visibility: v.oneOf(body.visibility, VISIBILITIES, 'visibilidade', 'public'),
    tag: v.text(body.tag, 'tag', { max: 40, nullable: true })
  }

  return tagsLib.resolveByName(req.user.id, payload.tag)
    .then(function (tagRow) {
      return db.query(
        'INSERT INTO notes (user_id, tag_id, url, domain, mark, title, note, visibility) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.user.id,
          tagRow ? tagRow.id : null,
          payload.url,
          described.domain,
          described.mark,
          payload.title,
          payload.note,
          payload.visibility
        ]
      )
    })
    .then(function (result) {
      return findOwned(req.user.id, result.insertId)
    })
    .then(function (row) {
      req.log.info('nota criada', { noteId: row.id })
      res.status(201).json(route.envelope(req, { note: mappers.toNote(row) }))
    })
}))

// PATCH e nao PUT: o card edita campo a campo (arquivar, trocar visibilidade)
// sem reenviar a nota inteira.
router.patch('/:id', route.wrap(function (req, res) {
  var noteId = v.id(req.params.id, 'id')
  var body = req.body || {}

  return findOwned(req.user.id, noteId)
    .then(function (current) {
      var sets = []
      var params = []

      if (body.title !== undefined) {
        sets.push('title = ?')
        params.push(v.text(body.title, 'titulo', { required: true, max: 200 }))
      }

      if (body.note !== undefined) {
        sets.push('note = ?')
        params.push(v.text(body.note, 'anotacao', { max: 500, nullable: true }))
      }

      if (body.visibility !== undefined) {
        sets.push('visibility = ?')
        params.push(v.oneOf(body.visibility, VISIBILITIES, 'visibilidade', current.visibility))
      }

      // url, domain e mark sao derivados um do outro: ou mudam os tres, ou nenhum.
      if (body.url !== undefined) {
        var url = v.optionalUrl(body.url)
        var described = link.describe(url)
        sets.push('url = ?', 'domain = ?', 'mark = ?')
        params.push(url, described.domain, described.mark)
      }

      if (body.archived !== undefined) {
        sets.push('archived_at = ?')
        params.push(body.archived ? new Date() : null)
      }

      var tagStep = body.tag === undefined
        ? Promise.resolve(null)
        : tagsLib.resolveByName(req.user.id, v.text(body.tag, 'tag', { max: 40, nullable: true }))

      return tagStep.then(function (tagRow) {
        if (body.tag !== undefined) {
          sets.push('tag_id = ?')
          params.push(tagRow ? tagRow.id : null)
        }

        if (!sets.length) throw errors.badRequest('nada_para_atualizar', 'nenhum campo enviado')

        params.push(noteId, req.user.id)
        return db.query('UPDATE notes SET ' + sets.join(', ') + ' WHERE id = ? AND user_id = ?', params)
      })
    })
    .then(function () {
      return findOwned(req.user.id, noteId)
    })
    .then(function (row) {
      res.json(route.envelope(req, { note: mappers.toNote(row) }))
    })
}))

router.delete('/:id', route.wrap(function (req, res) {
  var noteId = v.id(req.params.id, 'id')

  return findOwned(req.user.id, noteId)
    .then(function () {
      return db.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, req.user.id])
    })
    .then(function () {
      req.log.info('nota removida', { noteId: noteId })
      res.status(204).end()
    })
}))

module.exports = router
