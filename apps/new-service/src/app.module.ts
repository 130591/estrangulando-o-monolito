import { Module } from '@nestjs/common'

import { AppConfigModule } from './config/config.module'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { ExampleModule } from './example/example.module'
import { HealthModule } from './health/health.module'
import { LoggingModule } from './logging/logging.module'
import { NotesModule } from './notes/notes.module'
import { ProfilesModule } from './profiles/profiles.module'
import { TagsModule } from './tags/tags.module'

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    HealthModule,
    // Sonda de ownership de rota do repo: prova quem atendeu.
    ExampleModule,
    // Cada modulo e uma unidade de estrangulamento: a borda pode mover
    // /api/notes para ca sem levar /api/auth junto.
    AuthModule,
    TagsModule,
    NotesModule,
    ProfilesModule,
  ],
})
export class AppModule {}
