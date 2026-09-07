// Iguais aos do legacy-api: e o que faz o token de um lado passar no outro.
// Mudar aqui sem mudar la desloga todo mundo no primeiro desvio de rota.
export const JWT_ISSUER = 'devnotes'
export const JWT_AUDIENCE = 'devnotes-app'
export const JWT_ALGORITHM = 'HS256' as const

// Claim `via`: registra de que lado a pessoa entrou, fora da validacao.
export const TOKEN_ISSUER_SERVICE = 'new-service'

export interface JwtClaims {
  sub: string
  email: string
  username: string
  name: string
  via: string
  iat: number
  exp: number
}
