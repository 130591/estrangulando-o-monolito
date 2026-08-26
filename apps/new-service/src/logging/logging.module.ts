import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClsModule, ClsService } from 'nestjs-cls'
import { LoggerModule } from 'nestjs-pino'
import { stdTimeFunctions } from 'pino'
import type { IncomingMessage } from 'node:http'

import type { EnvironmentVariables } from '../config/env.validation'
import { REQUEST_ID_HEADER, SEVERITY_BY_LEVEL } from './correlation'

const SILENT_PATHS = new Set(['/healthz', '/readyz'])

@Module({
  imports: [
    // mount: false porque o ClsMiddleware e montado a mao em main.ts, antes do
    // pino-http - senao os logs de request saem fora do contexto CLS.
    ClsModule.forRoot({ global: true, middleware: { mount: false } }),

    LoggerModule.forRootAsync({
      imports: [ClsModule],
      inject: [ConfigService, ClsService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>, cls: ClsService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          messageKey: 'message',
          timestamp: stdTimeFunctions.isoTime,
          base: { service: config.get('SERVICE_NAME', { infer: true }) },

          formatters: {
            level: (label: string) => ({ severity: SEVERITY_BY_LEVEL[label] ?? 'DEFAULT' }),
          },

          // mixin roda a cada linha: e o que poe requestId em TODO log.
          mixin: () => {
            const requestId = cls.getId()
            return requestId ? { requestId } : {}
          },

          genReqId: (req: IncomingMessage) => req.headers[REQUEST_ID_HEADER] as string,
          autoLogging: { ignore: (req: IncomingMessage) => SILENT_PATHS.has(req.url ?? '') },
          redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
        },
      }),
    }),
  ],
})
export class LoggingModule {}
