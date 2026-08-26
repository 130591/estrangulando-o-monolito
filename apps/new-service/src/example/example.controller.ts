import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClsService } from 'nestjs-cls'

import type { EnvironmentVariables } from '../config/env.validation'
import { CreateExampleDto } from './dto/create-example.dto'
import { ExampleService } from './example.service'

@Controller('example')
export class ExampleController {
  constructor(
    private readonly service: ExampleService,
    private readonly cls: ClsService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  // `source` mostra no navegador se a rota ja foi estrangulada.
  private envelope<T extends object>(payload: T) {
    return {
      source: this.config.get('SERVICE_NAME', { infer: true }),
      requestId: this.cls.getId(),
      ...payload,
    }
  }

  @Get('items')
  findAll() {
    return this.envelope({ items: this.service.findAll() })
  }

  @Get('items/:id')
  findOne(@Param('id') id: string) {
    return this.envelope({ item: this.service.findOne(id) })
  }

  @Post('items')
  create(@Body() dto: CreateExampleDto) {
    return this.envelope({ item: this.service.create(dto) })
  }

  @Get('status')
  status() {
    return this.envelope({ runtime: process.version, migrated: true })
  }
}
