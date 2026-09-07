'use strict'

// `URL` so virou global no Node 10.
var URL = require('url').URL

var FALLBACK_DOMAIN = 'link.salvo'

function domainFrom(rawUrl) {
  if (!rawUrl) return FALLBACK_DOMAIN
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '') || FALLBACK_DOMAIN
  } catch (err) {
    return FALLBACK_DOMAIN
  }
}

function pathFrom(rawUrl) {
  if (!rawUrl) return ''
  try {
    return new URL(rawUrl).pathname
  } catch (err) {
    return ''
  }
}

// Ordem importa: youtube.com/docs e YT.
function markFrom(rawUrl, domain) {
  if (/youtu/.test(domain)) return 'YT'
  if (/medium/.test(domain)) return 'MD'
  if (/(^|\.)(docs|dev|developer)\./.test(domain)) return 'DOC'
  if (/\/docs?(\/|$)/.test(pathFrom(rawUrl))) return 'DOC'
  return 'WEB'
}

// Gravados na escrita: o perfil publico e servido sem sessao e a listagem nao
// pode parsear url por card. O new-service repete esta derivacao.
function describe(rawUrl) {
  var domain = domainFrom(rawUrl)
  return { domain: domain, mark: markFrom(rawUrl, domain) }
}

function initialsFrom(name) {
  var parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

module.exports = {
  describe: describe,
  domainFrom: domainFrom,
  markFrom: markFrom,
  initialsFrom: initialsFrom
}
