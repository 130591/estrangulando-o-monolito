import { Inject, Injectable } from '@nestjs/common'
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus'
import type { Pool } from 'mysql2/promise'

import { MYSQL_POOL } from '../database/database.module'

// Terminus nao tem indicador de mysql2 pronto. O SELECT 1 usa o mesmo pool
// das rotas, para o readyz medir a conexao real e nao uma paralela.
@Injectable()
export class MysqlHealthIndicator {
  constructor(
    private readonly health: HealthIndicatorService,
    @Inject(MYSQL_POOL) private readonly pool: Pool,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key)

    try {
      await this.pool.query('SELECT 1')
      return indicator.up()
    } catch (error) {
      return indicator.down(error instanceof Error ? error.message : 'mysql indisponivel')
    }
  }
}
