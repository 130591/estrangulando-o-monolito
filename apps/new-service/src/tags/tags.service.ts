import { Injectable } from '@nestjs/common'

import { toTag } from '../common/mappers'
import type { ApiTag } from '../common/types'
import { TagsRepository } from './tags.repository'

@Injectable()
export class TagsService {
  constructor(private readonly tags: TagsRepository) {}

  async list(userId: string): Promise<ApiTag[]> {
    const rows = await this.tags.listFor(userId)
    return rows.map(toTag)
  }

  async create(userId: string, name: string): Promise<ApiTag> {
    const row = await this.tags.resolveByName(userId, name)
    return toTag(row!)
  }
}
