'use strict'

function HttpError(status, code, message) {
  Error.call(this, message)
  this.name = 'HttpError'
  this.status = status
  this.code = code
  this.message = message || code
  this.expose = true
}

HttpError.prototype = Object.create(Error.prototype)
HttpError.prototype.constructor = HttpError

module.exports = {
  HttpError: HttpError,
  badRequest: function (code, message) { return new HttpError(400, code, message) },
  unauthorized: function (code, message) { return new HttpError(401, code, message) },
  forbidden: function (code, message) { return new HttpError(403, code, message) },
  notFound: function (code, message) { return new HttpError(404, code, message) },
  conflict: function (code, message) { return new HttpError(409, code, message) }
}
