// Segmento de URL na raiz (/mariana): nao pode colidir com rota nenhuma.
// Identica a do legacy-api - conta criada de um lado tem que valer no outro.
export const RESERVED_USERNAMES = [
  'api', 'new', 'assets', 'vendor', 'views', 'static', 'public',
  'healthz', 'readyz', 'admin', 'entrar', 'criar', 'conta', 'sair',
  'notas', 'arquivadas', 'perfil', 'docs', 'changelog', 'sobre', 'app',
]

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,38}[a-z0-9])$/
