import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import type { AuthenticatedUser } from '../common/types'

// O perfil abre para qualquer visitante, mas o dono ve outro cabecalho. Token
// invalido nao derruba a request - so nao popula `request.user`.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T = AuthenticatedUser>(_err: unknown, user: T | false): T | null {
    return user === false ? null : (user as T)
  }
}
