'use strict'

var errors = require('./errors')

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
var USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,38}[a-z0-9])$/

// O username e um segmento de URL na raiz (/mariana), entao nao pode colidir
// com nenhuma rota - nem das que ainda vao existir.
var RESERVED_USERNAMES = [
  'api', 'new', 'assets', 'vendor', 'views', 'static', 'public',
  'healthz', 'readyz', 'admin', 'entrar', 'criar', 'conta', 'sair',
  'notas', 'arquivadas', 'perfil', 'docs', 'changelog', 'sobre', 'app'
]

function text(raw, field, options) {
  var opts = options || {}
  var value = raw === undefined || raw === null ? '' : String(raw).trim()

  if (!value) {
    if (opts.required) throw errors.badRequest('campo_obrigatorio', field + ' e obrigatorio')
    return opts.nullable ? null : ''
  }

  if (opts.min && value.length < opts.min) {
    throw errors.badRequest('campo_curto', field + ' precisa de ao menos ' + opts.min + ' caracteres')
  }
  if (opts.max && value.length > opts.max) {
    throw errors.badRequest('campo_longo', field + ' passa de ' + opts.max + ' caracteres')
  }

  return value
}

function email(raw) {
  var value = text(raw, 'e-mail', { required: true, max: 255 }).toLowerCase()
  if (!EMAIL_RE.test(value)) throw errors.badRequest('email_invalido', 'e-mail invalido')
  return value
}

// 72 e o teto do bcrypt: acima disso os bytes extras sao ignorados em silencio.
function password(raw) {
  var value = raw === undefined || raw === null ? '' : String(raw)
  if (value.length < 8) throw errors.badRequest('senha_curta', 'a senha precisa de ao menos 8 caracteres')
  if (value.length > 72) throw errors.badRequest('senha_longa', 'a senha passa de 72 caracteres')
  return value
}

function username(raw) {
  var value = text(raw, 'username', { required: true, max: 40 }).toLowerCase()
  if (!USERNAME_RE.test(value)) {
    throw errors.badRequest('username_invalido', 'use 3 a 40 caracteres: letras, numeros, hifen ou _')
  }
  if (RESERVED_USERNAMES.indexOf(value) !== -1) {
    throw errors.badRequest('username_reservado', 'esse username e reservado')
  }
  return value
}

function oneOf(raw, allowed, field, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback
  var value = String(raw)
  if (allowed.indexOf(value) === -1) {
    throw errors.badRequest('valor_invalido', field + ' deve ser um de: ' + allowed.join(', '))
  }
  return value
}

function id(raw, field) {
  var value = String(raw === undefined ? '' : raw)
  if (!/^[0-9]{1,19}$/.test(value)) throw errors.badRequest('id_invalido', field + ' invalido')
  return value
}

// Aceita url sem esquema, que e o que se cola do navegador na maioria das vezes.
function optionalUrl(raw) {
  var value = text(raw, 'url', { max: 2048, nullable: true })
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value
  if (value.length > 2048) throw errors.badRequest('campo_longo', 'url passa de 2048 caracteres')
  return value
}

module.exports = {
  text: text,
  email: email,
  password: password,
  username: username,
  oneOf: oneOf,
  id: id,
  optionalUrl: optionalUrl,
  RESERVED_USERNAMES: RESERVED_USERNAMES
}
