import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createPool, type Pool } from 'mysql2/promise'
import type { EnvironmentVariables } from '../config/env.validation'

export const MYSQL_POOL = Symbol('MYSQL_POOL')

const poolProvider = {
  provide: MYSQL_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService<EnvironmentVariables, true>): Pool =>
    createPool({
      host: config.get('DB_HOST', { infer: true }),
      port: config.get('DB_PORT', { infer: true }),
      database: config.get('DB_NAME', { infer: true }),
      user: config.get('DB_USER', { infer: true }),
      password: config.get('DB_PASSWORD', { infer: true }),
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4_general_ci',
      dateStrings: true,
      timezone: 'Z',
      namedPlaceholders: false,
    }),
}

@Global()
@Module({
  providers: [poolProvider],
  exports: [MYSQL_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end()
  }
}
