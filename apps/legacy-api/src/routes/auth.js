'use strict'

var express = require('express')
var bcrypt = require('bcryptjs')

var db = require('../db')
var errors = require('../lib/errors')
var mappers = require('../lib/mappers')
var route = require('../lib/route')
var tokens = require('../lib/tokens')
var v = require('../lib/validate')
var auth = require('../middleware/auth')

var router = express.Router()

// Toda conta nasce com as seis tags do design: sem elas o dashboard abriria com
// a barra de filtros vazia e o modal sem nenhuma opcao.
var DEFAULT_TAGS = [
  { name: 'Rust', hue: 45 },
  { name: 'Arquitetura', hue: 100 },
  { name: 'Backend', hue: 160 },
  { name: 'Database', hue: 200 },
  { name: 'React', hue: 250 },
  { name: 'Tooling', hue: 310 }
]

var BCRYPT_ROUNDS = 10

// Comparar mesmo sem usuario, contra um hash descartavel: senao o tempo de
// resposta diria quais e-mails existem.
var DUMMY_HASH = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'

function seedTags(userId) {
  var values = DEFAULT_TAGS.map(function (tag) {
    return [userId, tag.name, tag.hue]
  })
  return db.query('INSERT INTO tags (user_id, name, hue) VALUES ?', [values])
}

function issue(req, res, userRow) {
  var user = mappers.toUser(userRow)
  res.json(route.envelope(req, { token: tokens.sign(user), user: user }))
}

router.post('/register', route.wrap(function (req, res) {
  var body = req.body || {}
  var payload = {
    email: v.email(body.email),
    username: v.username(body.username),
    name: v.text(body.name, 'nome', { required: true, min: 2, max: 80 }),
    bio: v.text(body.bio, 'bio', { max: 280, nullable: true })
  }
  var plain = v.password(body.password)

  return bcrypt.hash(plain, BCRYPT_ROUNDS)
    .then(function (hash) {
      return db.query(
        'INSERT INTO users (email, username, name, bio, password_hash) VALUES (?, ?, ?, ?, ?)',
        [payload.email, payload.username, payload.name, payload.bio, hash]
      )
    })
    .then(function (result) {
      return seedTags(result.insertId).then(function () {
        return db.queryOne('SELECT * FROM users WHERE id = ?', [result.insertId])
      })
    })
    .then(function (row) {
      req.log.info('conta criada', { userId: row.id, username: row.username })
      res.status(201)
      issue(req, res, row)
    })
    .catch(function (err) {
      // O unique index e quem decide: checar antes abriria janela de corrida.
      if (err.code === 'ER_DUP_ENTRY') {
        var field = /uq_users_username/.test(err.message) ? 'username' : 'e-mail'
        throw errors.conflict('ja_existe', 'esse ' + field + ' ja esta em uso')
      }
      throw err
    })
}))

router.post('/login', route.wrap(function (req, res) {
  var body = req.body || {}
  var email = v.email(body.email)
  var plain = String(body.password || '')

  return db.queryOne('SELECT * FROM users WHERE email = ?', [email])
    .then(function (row) {
      return bcrypt.compare(plain, row ? row.password_hash : DUMMY_HASH).then(function (ok) {
        if (!ok || !row) throw errors.unauthorized('credenciais_invalidas', 'e-mail ou senha incorretos')
        return row
      })
    })
    .then(function (row) {
      req.log.info('login', { userId: row.id })
      issue(req, res, row)
    })
}))

// E por aqui que os dois fronts confirmam, no boot, que a sessao guardada no
// localStorage ainda vale.
router.get('/me', auth.requireAuth, route.wrap(function (req, res) {
  return db.queryOne('SELECT * FROM users WHERE id = ?', [req.user.id])
    .then(function (row) {
      if (!row) throw errors.unauthorized('conta_removida', 'sessao invalida')
      res.json(route.envelope(req, { user: mappers.toUser(row), via: req.user.via }))
    })
}))

module.exports = router
module.exports.DEFAULT_TAGS = DEFAULT_TAGS
