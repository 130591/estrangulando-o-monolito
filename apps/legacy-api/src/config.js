'use strict'

function required(name) {
  var value = process.env[name]
  if (!value) throw new Error('variavel de ambiente obrigatoria ausente: ' + name)
  return value
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8080,

  db: {
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'app',
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app'
  },

  // O segredo e o mesmo do new-service de proposito: um token emitido aqui
  // vale la e vice-versa.
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'devnotes',
    audience: 'devnotes-app'
  }
}
