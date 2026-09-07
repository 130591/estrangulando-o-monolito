-- Conta pronta para abrir o app sem cadastro: mariana@devnotes.app / devnotes
--
-- Os intervalos sao relativos a NOW() para o dashboard nunca nascer com datas
-- velhas. O hash e bcrypt cost 10, literal porque SQL nao gera bcrypt.

SET NAMES utf8mb4;

INSERT INTO users (email, username, name, bio, password_hash) VALUES (
  'mariana@devnotes.app',
  'mariana',
  'Mariana Souza',
  'Backend em Go, estudando sistemas distribuídos. Aqui fica tudo que li e valeu a pena.',
  '$2a$10$hHv9TDI7/khIqtQjsbEqdO2N6KTMu9svdqsABBTiH8Mnux/0Cb9l6'
);

SET @uid = LAST_INSERT_ID();

INSERT INTO tags (user_id, name, hue) VALUES
  (@uid, 'Rust',        45),
  (@uid, 'Arquitetura', 100),
  (@uid, 'Backend',     160),
  (@uid, 'Database',    200),
  (@uid, 'React',       250),
  (@uid, 'Tooling',     310);

INSERT INTO notes (user_id, tag_id, url, domain, mark, title, note, visibility, created_at) VALUES
  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'Rust'),
   'https://www.youtube.com/watch?v=ownership', 'youtube.com', 'YT',
   'Ownership e borrow checker sem dor de cabeça',
   'Explicação com diagramas que finalmente fez sentido.',
   'public', DATE_SUB(NOW(), INTERVAL 2 DAY)),

  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'Backend'),
   'https://medium.com/filas-resilientes', 'medium.com', 'MD',
   'Filas resilientes: retry, backoff e idempotência',
   'Salvei pelo trecho sobre dead letter queues.',
   'public', DATE_SUB(NOW(), INTERVAL 4 DAY)),

  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'Database'),
   'https://supabase.com/docs/guides/auth/row-level-security', 'supabase.com', 'DOC',
   'Row Level Security na prática',
   'Referência para o projeto do fim de semana.',
   'private', DATE_SUB(NOW(), INTERVAL 6 DAY)),

  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'React'),
   'https://medium.com/react-server-components', 'medium.com', 'MD',
   'React Server Components: o que muda de verdade',
   'Ler de novo antes de refatorar o dashboard.',
   'public', DATE_SUB(NOW(), INTERVAL 9 DAY)),

  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'Tooling'),
   'https://www.youtube.com/watch?v=neovim', 'youtube.com', 'YT',
   'Neovim do zero em 40 minutos',
   'Config mínima, sem 30 plugins.',
   'public', DATE_SUB(NOW(), INTERVAL 11 DAY)),

  (@uid, (SELECT id FROM tags WHERE user_id = @uid AND name = 'Arquitetura'),
   'https://blog.pragdave.me/abstracao-prematura', 'blog.pragdave.me', 'WEB',
   'O custo real da abstração prematura',
   'Bom argumento para a próxima code review.',
   'public', DATE_SUB(NOW(), INTERVAL 16 DAY));
