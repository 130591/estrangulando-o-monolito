import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { NotesModule } from '../notes/notes.module'
import { TagsModule } from '../tags/tags.module'
import { ProfilesController } from './profiles.controller'
import { ProfilesService } from './profiles.service'

@Module({
  imports: [AuthModule, NotesModule, TagsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
