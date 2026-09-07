import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors } from '@nestjs/common'

import { EnvelopeInterceptor } from '../common/envelope.interceptor'
import type { AuthenticatedUser } from '../common/types'
import { AuthService } from './auth.service'
import { CurrentUser } from './current-user.decorator'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Controller('auth')
@UseInterceptors(EnvelopeInterceptor)
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    // `via` diz de que lado a sessao nasceu.
    return { user: await this.service.me(user.id), via: user.via }
  }
}
