'use strict'

var db = require('../db')

// So roda na criacao da tag: o hue fica gravado e os dois fronts leem a mesma
// cor do banco, em vez de cada um reimplementar este hash.
function hueFor(name) {
  var hash = 0
  var text = String(name)
  for (var i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360
  }
  return hash
}

// INSERT IGNORE + SELECT em vez de SELECT + INSERT: duas abas salvando a mesma
// tag nova nao podem estourar o unique index.
function resolveByName(userId, name) {
  if (!name) return Promise.resolve(null)

  return db.query(
    'INSERT IGNORE INTO tags (user_id, name, hue) VALUES (?, ?, ?)',
    [userId, name, hueFor(name)]
  ).then(function () {
    return db.queryOne('SELECT * FROM tags WHERE user_id = ? AND name = ?', [userId, name])
  })
}

function listFor(userId) {
  return db.query('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC', [userId])
}

module.exports = { hueFor: hueFor, resolveByName: resolveByName, listFor: listFor }
