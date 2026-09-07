'use strict'

var link = require('./link')

function isoDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value).replace(' ', 'T') + 'Z'
}

// BIGINT chega como number: acima de 2^53 o JSON perderia precisao, entao o
// contrato publico dos ids e string nos dois backends.
function toId(value) {
  return value === null || value === undefined ? null : String(value)
}

function toUser(row) {
  if (!row) return null
  return {
    id: toId(row.id),
    email: row.email,
    username: row.username,
    name: row.name,
    bio: row.bio || null,
    initials: link.initialsFrom(row.name),
    createdAt: isoDate(row.created_at)
  }
}

function toPublicUser(row) {
  var user = toUser(row)
  if (!user) return null
  delete user.email
  return user
}

function toTag(row) {
  if (!row) return null
  return {
    id: toId(row.id),
    name: row.name,
    hue: Number(row.hue)
  }
}

function toNote(row) {
  if (!row) return null
  return {
    id: toId(row.id),
    url: row.url || null,
    domain: row.domain,
    mark: row.mark,
    title: row.title,
    note: row.note || null,
    tag: row.tag_id ? { id: toId(row.tag_id), name: row.tag_name, hue: Number(row.tag_hue) } : null,
    visibility: row.visibility,
    archived: Boolean(row.archived_at),
    createdAt: isoDate(row.created_at)
  }
}

module.exports = {
  isoDate: isoDate,
  toId: toId,
  toUser: toUser,
  toPublicUser: toPublicUser,
  toTag: toTag,
  toNote: toNote
}
