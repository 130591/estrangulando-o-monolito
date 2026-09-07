import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { describe } from '../common/link'
import { toNote } from '../common/mappers'
import type { ApiNote, NoteRow, NoteStats } from '../common/types'
import { TagsRepository } from '../tags/tags.repository'
import { NotesRepository, type NotePatch } from './notes.repository'
import type { CreateNoteDto } from './dto/create-note.dto'
import type { ListNotesQuery } from './dto/list-notes.query'
import type { UpdateNoteDto } from './dto/update-note.dto'

const DEFAULT_TITLE = 'Nota sem título'

@Injectable()
export class NotesService {
  constructor(
    private readonly notes: NotesRepository,
    private readonly tags: TagsRepository,
  ) {}

  async list(userId: string, query: ListNotesQuery): Promise<{ notes: ApiNote[]; stats: NoteStats }> {
    const [rows, stats] = await Promise.all([
      this.notes.list(userId, {
        search: query.q,
        tag: query.tag,
        archived: query.archived ?? false,
      }),
      this.notes.stats(userId),
    ])

    return { notes: rows.map(toNote), stats }
  }

  async create(userId: string, dto: CreateNoteDto): Promise<ApiNote> {
    const url = normalizeUrl(dto.url)
    const { domain, mark } = describe(url)
    const tag = await this.tags.resolveByName(userId, dto.tag ?? null)

    const id = await this.notes.insert(userId, {
      url,
      domain,
      mark,
      title: dto.title || DEFAULT_TITLE,
      note: dto.note || null,
      visibility: dto.visibility ?? 'public',
      tagId: tag ? String(tag.id) : null,
    })

    return toNote(await this.requireOwned(userId, id))
  }

  async update(userId: string, noteId: string, dto: UpdateNoteDto): Promise<ApiNote> {
    // Sem isso um id de outro dono daria 0 linhas afetadas, indistinguivel
    // de "nada mudou".
    await this.requireOwned(userId, noteId)

    const patch: NotePatch = {
      title: dto.title,
      note: dto.note === undefined ? undefined : dto.note || null,
      visibility: dto.visibility,
      archived: dto.archived,
    }

    if (dto.url !== undefined) {
      const url = normalizeUrl(dto.url)
      patch.link = { url, ...describe(url) }
    }

    if (dto.tag !== undefined) {
      const tag = await this.tags.resolveByName(userId, dto.tag || null)
      patch.tagId = tag ? String(tag.id) : null
    }

    const touched = await this.notes.update(userId, noteId, patch)
    if (touched === 0 && !hasAnyField(patch)) {
      throw new BadRequestException('nenhum campo enviado')
    }

    return toNote(await this.requireOwned(userId, noteId))
  }

  async remove(userId: string, noteId: string): Promise<void> {
    const removed = await this.notes.remove(userId, noteId)
    if (removed === 0) throw new NotFoundException('nota nao encontrada')
  }

  private async requireOwned(userId: string, noteId: string): Promise<NoteRow> {
    const row = await this.notes.findOwned(userId, noteId)
    // 404 e nao 403: um 403 confirmaria que o id existe.
    if (!row) throw new NotFoundException('nota nao encontrada')
    return row
  }
}

// Aceita url sem esquema, que e o que se cola do navegador.
function normalizeUrl(raw: string | undefined): string | null {
  const value = (raw ?? '').trim()
  if (!value) return null
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  if (withScheme.length > 2048) throw new BadRequestException('url passa de 2048 caracteres')
  return withScheme
}

function hasAnyField(patch: NotePatch): boolean {
  return Object.values(patch).some((value) => value !== undefined)
}
