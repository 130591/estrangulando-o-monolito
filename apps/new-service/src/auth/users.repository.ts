import { Inject, Injectable } from '@nestjs/common'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { MYSQL_POOL } from '../database/database.module'
import type { UserRow } from '../common/types'

export interface NewUser {
  email: string
  username: string
  name: string
  bio: string | null
  passwordHash: string
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email],
    )
    return (rows[0] as UserRow) ?? null
  }

  async findById(id: string): Promise<UserRow | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id])
    return (rows[0] as UserRow) ?? null
  }

  async findByUsername(username: string): Promise<UserRow | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )
    return (rows[0] as UserRow) ?? null
  }

  async insert(user: NewUser): Promise<string> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO users (email, username, name, bio, password_hash) VALUES (?, ?, ?, ?, ?)',
      [user.email, user.username, user.name, user.bio, user.passwordHash],
    )
    return String(result.insertId)
  }
}
