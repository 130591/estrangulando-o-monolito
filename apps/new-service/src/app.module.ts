import { Module } from '@nestjs/common'

import { AppConfigModule } from './config/config.module'
import { ExampleModule } from './example/example.module'
import { HealthModule } from './health/health.module'
import { LoggingModule } from './logging/logging.module'

@Module({
  imports: [AppConfigModule, LoggingModule, HealthModule, ExampleModule],
})
export class AppModule {}
