import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import type { EnvironmentVariables } from '../config/env.validation'
import type { AuthenticatedUser } from '../common/types'
import { JWT_ALGORITHM, JWT_AUDIENCE, JWT_ISSUER, type JwtClaims } from './jwt.constants'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM],
    })
  }

  // Nao consulta o banco: o `sub` ja e a chave que as queries usam.
  validate(payload: JwtClaims): AuthenticatedUser {
    return {
      id: String(payload.sub),
      email: payload.email,
      username: payload.username,
      name: payload.name,
      via: payload.via,
    }
  }
}
