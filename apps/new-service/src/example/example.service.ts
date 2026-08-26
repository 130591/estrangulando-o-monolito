import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { CreateExampleDto } from './dto/create-example.dto'

export interface ExampleItem {
  id: string
  name: string
  description?: string
}

// Estado em memoria: com varias instancias no Cloud Run isso nao persiste.
@Injectable()
export class ExampleService {
  private readonly items: ExampleItem[] = [
    { id: '1', name: 'example-one' },
    { id: '2', name: 'example-two' },
  ]

  findAll(): ExampleItem[] {
    return this.items
  }

  findOne(id: string): ExampleItem {
    const item = this.items.find((candidate) => candidate.id === id)
    if (!item) throw new NotFoundException(`item ${id} nao encontrado`)
    return item
  }

  create(dto: CreateExampleDto): ExampleItem {
    const item: ExampleItem = { id: randomUUID(), ...dto }
    this.items.push(item)
    return item
  }
}
