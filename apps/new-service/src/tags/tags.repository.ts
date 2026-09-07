import { Inject, Injectable } from '@nestjs/common'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { MYSQL_POOL } from '../database/database.module'
import { hueFor } from '../common/link'
import type { TagRow } from '../common/types'

// Sem elas o dashboard abre com a barra de filtros vazia e o modal sem opcao.
export const DEFAULT_TAGS: ReadonlyArray<{ name: string; hue: number }> = [
  { name: 'Rust', hue: 45 },
  { name: 'Arquitetura', hue: 100 },
  { name: 'Backend', hue: 160 },
  { name: 'Database', hue: 200 },
  { name: 'React', hue: 250 },
  { name: 'Tooling', hue: 310 },
]

@Injectable()
export class TagsRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async listFor(userId: string): Promise<TagRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC',
      [userId],
    )
    return rows as TagRow[]
  }

  // INSERT IGNORE + SELECT em vez de SELECT + INSERT: duas abas salvando a
  // mesma tag nova nao podem estourar o unique index.
  async resolveByName(userId: string, name: string | null): Promise<TagRow | null> {
    if (!name) return null

    await this.pool.execute<ResultSetHeader>(
      'INSERT IGNORE INTO tags (user_id, name, hue) VALUES (?, ?, ?)',
      [userId, name, hueFor(name)],
    )

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM tags WHERE user_id = ? AND name = ?',
      [userId, name],
    )
    return (rows[0] as TagRow) ?? null
  }

  // `query` e nao `execute`: o INSERT em lote com `VALUES ?` e expansao do
  // driver, que prepared statement nao faz.
  async seedDefaults(userId: string): Promise<void> {
    const values = DEFAULT_TAGS.map((tag) => [userId, tag.name, tag.hue])
    await this.pool.query('INSERT IGNORE INTO tags (user_id, name, hue) VALUES ?', [values])
  }

  async countFor(userId: string): Promise<number> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM tags WHERE user_id = ?',
      [userId],
    )
    return Number(rows[0]?.total ?? 0)
  }
}
