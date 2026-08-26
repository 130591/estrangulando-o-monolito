import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus'

// Sem prefixo: /healthz e /readyz ficam fora do ROUTE_PREFIX (ver main.ts).
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get('healthz')
  @HealthCheck()
  liveness() {
    return this.health.check([])
  }

  @Get('readyz')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024)])
  }
}
