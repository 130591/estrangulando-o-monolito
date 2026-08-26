import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

export const REQUEST_ID_HEADER = 'x-request-id'

// pino escreve label ('info'); o Cloud Logging classifica por `severity`.
export const SEVERITY_BY_LEVEL: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[REQUEST_ID_HEADER]
  const requestId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID()

  req.headers[REQUEST_ID_HEADER] = requestId
  res.setHeader(REQUEST_ID_HEADER, requestId)

  next()
}
