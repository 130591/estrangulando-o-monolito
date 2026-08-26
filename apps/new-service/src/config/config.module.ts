import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { validateEnv } from './env.validation'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
