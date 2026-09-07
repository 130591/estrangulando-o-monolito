import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { EnvelopeInterceptor } from '../common/envelope.interceptor'
import type { AuthenticatedUser } from '../common/types'
import { ProfilesService } from './profiles.service'

// Sem sessao obrigatoria: o perfil e a pagina que se compartilha.
@Controller('profiles')
@UseGuards(OptionalJwtAuthGuard)
@UseInterceptors(EnvelopeInterceptor)
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get(':username')
  byUsername(@Param('username') username: string, @CurrentUser() viewer: AuthenticatedUser | null) {
    return this.service.byUsername(username, viewer?.id ?? null)
  }
}
