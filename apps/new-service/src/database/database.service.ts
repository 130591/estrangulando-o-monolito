import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Pool, RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise'
import { MYSQL_POOL } from './database.module'

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name)
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async execute<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: any[],
  ): Promise<[T, FieldPacket[]]> {
    try {
      return await this.pool.execute<T>(sql, params)
    } catch (error: any) {
      this.handleDatabaseError(error)
      throw error
    }
  }

	private handleDatabaseError(error: any): void {
    const infraErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'PROTOCOL_CONNECTION_LOST',
      'ER_CON_COUNT_ERROR',
      'ER_ACCESS_DENIED_ERROR',
      'ENOTFOUND'
    ]
		
    if (error.code && infraErrors.includes(error.code)) {
      this.logger.error(
        { err: error, code: error.code }, 
        'CRITICAL ALERT: Database communication failure!'
      )
    }
  }
}