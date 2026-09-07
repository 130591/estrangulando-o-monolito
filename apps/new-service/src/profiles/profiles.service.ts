import { Injectable, NotFoundException } from '@nestjs/common'

import { UsersRepository } from '../auth/users.repository'
import { isoDate, toNote, toPublicUser } from '../common/mappers'
import type { ApiNote, ApiUser } from '../common/types'
import { NotesRepository } from '../notes/notes.repository'
import { TagsRepository } from '../tags/tags.repository'

export interface PublicProfile {
  profile: ApiUser
  stats: { publicNotes: number; tags: number; memberSince: string | null }
  isOwner: boolean
  notes: ApiNote[]
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly users: UsersRepository,
    private readonly notes: NotesRepository,
    private readonly tags: TagsRepository,
  ) {}

  async byUsername(username: string, viewerId: string | null): Promise<PublicProfile> {
    const user = await this.users.findByUsername(username.toLowerCase())
    if (!user) throw new NotFoundException('perfil nao encontrado')

    const userId = String(user.id)
    const [rows, tagCount] = await Promise.all([
      // O filtro de visibilidade e do servidor: nota privada nao sai daqui
      // nem para ser escondida no front.
      this.notes.listPublic(userId),
      this.tags.countFor(userId),
    ])

    return {
      profile: toPublicUser(user),
      stats: {
        publicNotes: rows.length,
        tags: tagCount,
        memberSince: isoDate(user.created_at),
      },
      isOwner: viewerId !== null && viewerId === userId,
      notes: rows.map(toNote),
    }
  }
}
