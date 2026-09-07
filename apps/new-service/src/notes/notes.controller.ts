import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EnvelopeInterceptor } from '../common/envelope.interceptor'
import type { AuthenticatedUser } from '../common/types'
import { CreateNoteDto } from './dto/create-note.dto'
import { ListNotesQuery } from './dto/list-notes.query'
import { UpdateNoteDto } from './dto/update-note.dto'
import { NotesService } from './notes.service'

@Controller('notes')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EnvelopeInterceptor)
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNotesQuery) {
    return this.service.list(user.id, query)
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNoteDto) {
    return { note: await this.service.create(user.id, dto) }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return { note: await this.service.update(user.id, id, dto) }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.service.remove(user.id, id)
  }
}
