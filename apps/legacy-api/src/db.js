'use strict'

// mysql 2.x (callbacks) e o driver que ainda roda em Node 9.
var mysql = require('mysql')
var config = require('./config')
var logger = require('./logger')

var pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci',
  dateStrings: true
})

pool.on('error', function (err) {
  logger.error('erro no pool mysql', { error: err.message, code: err.code })
})

function query(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params || [], function (err, rows) {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function queryOne(sql, params) {
  return query(sql, params).then(function (rows) {
    return rows.length ? rows[0] : null
  })
}

function ping() {
  return query('SELECT 1 AS ok').then(function () {
    return true
  })
}

function close() {
  return new Promise(function (resolve) {
    pool.end(function () {
      resolve()
    })
  })
}

module.exports = {
  pool: pool,
  query: query,
  queryOne: queryOne,
  ping: ping,
  close: close
}
