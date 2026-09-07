import { Inject, Injectable } from '@nestjs/common'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { MYSQL_POOL } from '../database/database.module'
import type { NoteRow, NoteStats, Visibility } from '../common/types'

// O que o prepared statement do mysql2 aceita como bind. Existe porque as
// queries com WHERE dinamico montam o array de parametros peca a peca.
type SqlParam = string | number | boolean | Date | null

// A tag vem no mesmo SELECT: N+1 numa grade de seis cards seria absurdo.
const SELECT_NOTE =
  'SELECT n.*, t.name AS tag_name, t.hue AS tag_hue ' +
  'FROM notes n LEFT JOIN tags t ON t.id = n.tag_id '

export interface ListFilters {
  search?: string
  tag?: string
  archived: boolean
}

export interface NoteFields {
  url: string | null
  domain: string
  mark: string
  title: string
  note: string | null
  visibility: Visibility
  tagId: string | null
}

// url, domain e mark viajam juntos: um Partial solto deixaria escrever url
// nova com o mark velho.
export type NotePatch = Partial<Omit<NoteFields, 'url' | 'domain' | 'mark'>> & {
  archived?: boolean
  link?: Pick<NoteFields, 'url' | 'domain' | 'mark'>
}

@Injectable()
export class NotesRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async list(userId: string, filters: ListFilters): Promise<NoteRow[]> {
    let sql = `${SELECT_NOTE}WHERE n.user_id = ? AND n.archived_at IS ${
      filters.archived ? 'NOT NULL' : 'NULL'
    }`
    const params: SqlParam[] = [userId]

    if (filters.tag) {
      sql += ' AND t.name = ?'
      params.push(filters.tag)
    }

    if (filters.search) {
      sql += ' AND (n.title LIKE ? OR t.name LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    sql += ' ORDER BY n.created_at DESC, n.id DESC LIMIT 200'

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, params)
    return rows as NoteRow[]
  }

  async listPublic(userId: string): Promise<NoteRow[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `${SELECT_NOTE}WHERE n.user_id = ? AND n.visibility = 'public' AND n.archived_at IS NULL ` +
        'ORDER BY n.created_at DESC, n.id DESC LIMIT 200',
      [userId],
    )
    return rows as NoteRow[]
  }

  async findOwned(userId: string, noteId: string): Promise<NoteRow | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `${SELECT_NOTE}WHERE n.id = ? AND n.user_id = ?`,
      [noteId, userId],
    )
    return (rows[0] as NoteRow) ?? null
  }

  // Sobre o acervo inteiro, nao sobre o resultado filtrado - por isso
  // query separada.
  async stats(userId: string): Promise<NoteStats> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total, ' +
        "SUM(visibility = 'public' AND archived_at IS NULL) AS publicCount, " +
        'SUM(archived_at IS NOT NULL) AS archived ' +
        'FROM notes WHERE user_id = ?',
      [userId],
    )

    const row = rows[0] ?? {}
    return {
      total: Number(row.total ?? 0),
      publicCount: Number(row.publicCount ?? 0),
      archived: Number(row.archived ?? 0),
    }
  }

  async insert(userId: string, fields: NoteFields): Promise<string> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO notes (user_id, tag_id, url, domain, mark, title, note, visibility) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        fields.tagId,
        fields.url,
        fields.domain,
        fields.mark,
        fields.title,
        fields.note,
        fields.visibility,
      ],
    )
    return String(result.insertId)
  }

  async update(userId: string, noteId: string, patch: NotePatch): Promise<number> {
    const sets: string[] = []
    const params: SqlParam[] = []

    const column = (sql: string, value: SqlParam) => {
      sets.push(sql)
      params.push(value)
    }

    if (patch.title !== undefined) column('title = ?', patch.title)
    if (patch.note !== undefined) column('note = ?', patch.note)
    if (patch.visibility !== undefined) column('visibility = ?', patch.visibility)
    if (patch.tagId !== undefined) column('tag_id = ?', patch.tagId)
    if (patch.archived !== undefined) column('archived_at = ?', patch.archived ? new Date() : null)

    if (patch.link !== undefined) {
      column('url = ?', patch.link.url)
      column('domain = ?', patch.link.domain)
      column('mark = ?', patch.link.mark)
    }

    if (sets.length === 0) return 0

    params.push(noteId, userId)
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    )
    return result.affectedRows
  }

  async remove(userId: string, noteId: string): Promise<number> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId],
    )
    return result.affectedRows
  }
}
