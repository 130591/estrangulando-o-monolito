'use strict'

var express = require('express')

var db = require('../db')
var errors = require('../lib/errors')
var mappers = require('../lib/mappers')
var route = require('../lib/route')
var auth = require('../middleware/auth')

var router = express.Router()

// Sem sessao obrigatoria: o perfil e a pagina que se compartilha. optionalAuth
// so serve para o front saber se quem olha e o dono.
router.get('/:username', auth.optionalAuth, route.wrap(function (req, res) {
  var username = String(req.params.username || '').toLowerCase()

  return db.queryOne('SELECT * FROM users WHERE username = ?', [username])
    .then(function (user) {
      if (!user) throw errors.notFound('perfil_nao_encontrado', 'perfil nao encontrado')

      return Promise.all([
        // O filtro de visibilidade e do servidor, nunca do cliente: nota
        // privada nao pode sair daqui nem para ser escondida no front.
        db.query(
          'SELECT n.*, t.name AS tag_name, t.hue AS tag_hue ' +
          'FROM notes n LEFT JOIN tags t ON t.id = n.tag_id ' +
          'WHERE n.user_id = ? AND n.visibility = \'public\' AND n.archived_at IS NULL ' +
          'ORDER BY n.created_at DESC, n.id DESC LIMIT 200',
          [user.id]
        ),
        db.queryOne('SELECT COUNT(*) AS total FROM tags WHERE user_id = ?', [user.id])
      ]).then(function (results) {
        var notes = results[0]

        res.json(route.envelope(req, {
          profile: mappers.toPublicUser(user),
          stats: {
            publicNotes: notes.length,
            tags: Number(results[1].total) || 0,
            memberSince: mappers.isoDate(user.created_at)
          },
          isOwner: Boolean(req.user && String(req.user.id) === String(user.id)),
          notes: notes.map(mappers.toNote)
        }))
      })
    })
}))

module.exports = router
