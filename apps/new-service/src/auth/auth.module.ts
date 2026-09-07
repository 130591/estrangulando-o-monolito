import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import type { EnvironmentVariables } from '../config/env.validation'
import { TagsModule } from '../tags/tags.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JWT_ALGORITHM } from './jwt.constants'
import { JwtStrategy } from './jwt.strategy'
import { UsersRepository } from './users.repository'

@Module({
  imports: [
    PassportModule,
    // HS256 simetrico: o legacy-api assina com o mesmo segredo.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { algorithm: JWT_ALGORITHM },
      }),
    }),
    TagsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UsersRepository],
  exports: [UsersRepository],
})
export class AuthModule {}
