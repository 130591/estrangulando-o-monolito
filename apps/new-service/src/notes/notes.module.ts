import { Module } from '@nestjs/common'

import { TagsModule } from '../tags/tags.module'
import { NotesController } from './notes.controller'
import { NotesRepository } from './notes.repository'
import { NotesService } from './notes.service'

@Module({
  imports: [TagsModule],
  controllers: [NotesController],
  providers: [NotesRepository, NotesService],
  // ProfilesModule lista as notas publicas do dono do perfil.
  exports: [NotesRepository],
})
export class NotesModule {}
