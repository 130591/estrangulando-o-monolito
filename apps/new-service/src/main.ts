import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { ClsMiddleware } from 'nestjs-cls'
import { Logger } from 'nestjs-pino'
import type { Request } from 'express'

import { AppModule } from './app.module'
import type { EnvironmentVariables } from './config/env.validation'
import { correlationIdMiddleware, REQUEST_ID_HEADER } from './logging/correlation'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService)

  // Ordem importa: resolver o x-request-id primeiro, abrir o contexto CLS
  // depois, envolvendo todo o resto da stack.
  app.use(correlationIdMiddleware)

  const clsMiddleware = new ClsMiddleware({
    generateId: true,
    idGenerator: (req: Request) => req.headers[REQUEST_ID_HEADER] as string,
  })
  app.use(clsMiddleware.use.bind(clsMiddleware))

  app.setGlobalPrefix(config.get('ROUTE_PREFIX', { infer: true }), {
    exclude: ['healthz', 'readyz'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.enableShutdownHooks()

  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0')
}

void bootstrap()
