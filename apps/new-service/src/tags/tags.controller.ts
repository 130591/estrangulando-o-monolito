import { Body, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EnvelopeInterceptor } from '../common/envelope.interceptor'
import type { AuthenticatedUser } from '../common/types'
import { CreateTagDto } from './dto/create-tag.dto'
import { TagsService } from './tags.service'

@Controller('tags')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EnvelopeInterceptor)
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return { tags: await this.service.list(user.id) }
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTagDto) {
    return { tag: await this.service.create(user.id, dto.name) }
  }
}
