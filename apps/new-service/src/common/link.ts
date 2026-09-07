const FALLBACK_DOMAIN = 'link.salvo'

// Gravados na escrita, nao derivados no render. A mesma derivacao existe no
// legacy-api: o que nao pode divergir e o resultado, porque as duas
// implementacoes escrevem na mesma coluna.
export function domainFrom(rawUrl: string | null): string {
  if (!rawUrl) return FALLBACK_DOMAIN
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '') || FALLBACK_DOMAIN
  } catch {
    return FALLBACK_DOMAIN
  }
}

function pathFrom(rawUrl: string | null): string {
  if (!rawUrl) return ''
  try {
    return new URL(rawUrl).pathname
  } catch {
    return ''
  }
}

// Ordem importa: youtube.com/docs e YT.
export function markFrom(rawUrl: string | null, domain: string): string {
  if (/youtu/.test(domain)) return 'YT'
  if (/medium/.test(domain)) return 'MD'
  if (/(^|\.)(docs|dev|developer)\./.test(domain)) return 'DOC'
  if (/\/docs?(\/|$)/.test(pathFrom(rawUrl))) return 'DOC'
  return 'WEB'
}

export function describe(rawUrl: string | null): { domain: string; mark: string } {
  const domain = domainFrom(rawUrl)
  return { domain, mark: markFrom(rawUrl, domain) }
}

// "Mariana Souza" -> "MS".
export function initialsFrom(name: string): string {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// So roda na criacao da tag: o valor fica gravado e os dois fronts leem a
// mesma cor do banco.
export function hueFor(name: string): number {
  const text = String(name)
  let hash = 0
  // Por code unit, igual ao legacy-api: mesmo nome, mesmo hue nos dois lados.
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360
  }
  return hash
}
