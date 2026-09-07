import type { CSSProperties } from 'react'

import type { NoteStats, Tag, Visibility } from './types'

// Lightness e chroma fixos, so o hue varia: e o que mantem todas as pills com
// o mesmo peso visual no escuro.
const TAG_L = 0.78
const TAG_C = 0.12

function oklch(hue: number, alpha: number): string {
  const base = `${TAG_L} ${TAG_C} ${hue || 250}`
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${alpha})`
}

// Intl devolve "ago." em pt-BR: o ponto sai para casar com o design.
function shortMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase()
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function dateLabel(iso: string | null): string {
  if (!iso) return ''

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'

  const label = `${date.getDate()} ${shortMonth(date)}`
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label} ${String(date.getFullYear()).slice(2)}`
}

export function monthLabel(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${shortMonth(date)} ${date.getFullYear()}`
}

// O hue vem gravado na tag: os dois fronts pintam identico.
export function tagStyle(tag: Tag | null): CSSProperties {
  if (!tag) return {}
  return { color: oklch(tag.hue, 1), background: oklch(tag.hue, 0.12) }
}

export function tagOptionStyle(tag: Tag, selected: boolean): CSSProperties {
  if (!selected) return {}
  return {
    color: oklch(tag.hue, 1),
    background: oklch(tag.hue, 0.12),
    borderColor: oklch(tag.hue, 0.35),
  }
}

export function visibilityLabel(visibility: Visibility): string {
  return visibility === 'private' ? 'privado' : 'público'
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

export function countLabel(stats: NoteStats | null): string {
  if (!stats) return ''
  return (
    `${stats.total} ${plural(stats.total, 'nota', 'notas')} · ` +
    `${stats.publicCount} ${plural(stats.publicCount, 'pública', 'públicas')}`
  )
}
