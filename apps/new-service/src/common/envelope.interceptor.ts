import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClsService } from 'nestjs-cls'
import { map, type Observable } from 'rxjs'

import type { EnvironmentVariables } from '../config/env.validation'

// Mesmo envelope do legacy-api: `source` prova qual backend atendeu depois
// que a borda desvia a rota.
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const source = this.config.get('SERVICE_NAME', { infer: true })

    return next.handle().pipe(
      map((payload: unknown) => {
        // 204 nao tem corpo: envelopar undefined mandaria body onde nao ha.
        if (payload === undefined || payload === null) return payload
        return { source, requestId: this.cls.getId(), ...(payload as object) }
      }),
    )
  }
}
