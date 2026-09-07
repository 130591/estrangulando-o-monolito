import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'

import { toUser } from '../common/mappers'
import type { ApiUser, UserRow } from '../common/types'
import type { EnvironmentVariables } from '../config/env.validation'
import { TagsRepository } from '../tags/tags.repository'
import { JWT_AUDIENCE, JWT_ISSUER, TOKEN_ISSUER_SERVICE } from './jwt.constants'
import { UsersRepository } from './users.repository'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'

const BCRYPT_ROUNDS = 10

// Sem comparar contra um hash descartavel, o tempo de resposta diria quais
// e-mails estao cadastrados.
const DUMMY_HASH = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'

interface Session {
  token: string
  user: ApiUser
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly users: UsersRepository,
    private readonly tags: TagsRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async register(dto: RegisterDto): Promise<Session> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS)

    let userId: string
    try {
      userId = await this.users.insert({
        email: dto.email,
        username: dto.username,
        name: dto.name,
        bio: dto.bio ?? null,
        passwordHash,
      })
    } catch (error) {
      // O unique index decide: checar antes abriria janela de corrida.
      if (isDuplicateEntry(error)) {
        const field = /uq_users_username/.test(error.message) ? 'username' : 'e-mail'
        throw new ConflictException(`esse ${field} ja esta em uso`)
      }
      throw error
    }

    await this.tags.seedDefaults(userId)

    const row = await this.users.findById(userId)
    this.logger.log(`conta criada: ${dto.username}`)
    return this.session(row!)
  }

  async login(dto: LoginDto): Promise<Session> {
    const row = await this.users.findByEmail(dto.email)
    const ok = await compare(dto.password, row?.password_hash ?? DUMMY_HASH)

    if (!ok || !row) throw new UnauthorizedException('e-mail ou senha incorretos')

    return this.session(row)
  }

  // E por aqui que os dois fronts confirmam, no boot, que a sessao guardada
  // no localStorage ainda vale.
  async me(userId: string): Promise<ApiUser> {
    const row = await this.users.findById(userId)
    if (!row) throw new UnauthorizedException('sessao invalida')
    return toUser(row)
  }

  private session(row: UserRow): Session {
    const user = toUser(row)

    return {
      token: this.jwt.sign(
        {
          email: user.email,
          username: user.username,
          name: user.name,
          via: TOKEN_ISSUER_SERVICE,
        },
        {
          subject: user.id,
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }),
        },
      ),
      user,
    }
  }
}

function isDuplicateEntry(error: unknown): error is Error & { code: string } {
  return error instanceof Error && (error as { code?: string }).code === 'ER_DUP_ENTRY'
}
