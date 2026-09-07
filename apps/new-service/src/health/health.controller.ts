import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus'

import { MysqlHealthIndicator } from './mysql.health'

// Sem prefixo: /healthz e /readyz ficam fora do ROUTE_PREFIX (ver main.ts).
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly mysql: MysqlHealthIndicator,
  ) {}

  // Liveness: nao checa dependencia externa - se checasse, o banco fora do ar
  // reiniciaria o container em vez de so tira-lo do balanceamento.
  @Get('healthz')
  @HealthCheck()
  liveness() {
    return this.health.check([])
  }

  // Readiness: aqui sim o banco entra. Sem MySQL nenhuma rota do Dev Notes
  // responde, entao a instancia tem que sair do balanceamento.
  @Get('readyz')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.mysql.isHealthy('mysql'),
    ])
  }
}
