-- Fonte unica de verdade das tabelas: o legado (Node 9) e o new-service
-- (Node 22) escrevem nas mesmas linhas. Por isso o schema nao vive dentro de
-- nenhum ORM - SQL puro e o unico dialeto que os dois falam.
--
-- Roda so na primeira subida do volume mysql-data.

SET NAMES utf8mb4;

-- `username` e handle publico e segmento de URL; a lista de reservados vive
-- na aplicacao. `password_hash` e bcrypt nos dois lados, entao o hash escrito
-- por um valida no outro sem conversao.
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL,
  username      VARCHAR(40)     NOT NULL,
  name          VARCHAR(80)     NOT NULL,
  bio           VARCHAR(280)        NULL,
  password_hash CHAR(60)        NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- `hue` e o angulo oklch da pill. Gravado na criacao em vez de derivado em
-- runtime: os dois fronts pintam igual sem reimplementar o mesmo hash.
CREATE TABLE IF NOT EXISTS tags (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(40)     NOT NULL,
  hue        SMALLINT UNSIGNED NOT NULL DEFAULT 250,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_user_name (user_id, name),
  CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- `domain` e `mark` sao derivados da url na escrita e gravados: a listagem
-- nao pode parsear url a cada render. `archived_at` NULL = ativa; guardar o
-- instante deixa a aba "Arquivadas" ordenavel sem coluna extra.
CREATE TABLE IF NOT EXISTS notes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  tag_id      BIGINT UNSIGNED     NULL,
  url         VARCHAR(2048)       NULL,
  domain      VARCHAR(255)    NOT NULL DEFAULT 'link.salvo',
  mark        VARCHAR(4)      NOT NULL DEFAULT 'WEB',
  title       VARCHAR(200)    NOT NULL,
  note        VARCHAR(500)        NULL,
  visibility  ENUM('public','private') NOT NULL DEFAULT 'public',
  archived_at DATETIME            NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Cobre a query do dashboard (notas ativas do dono, mais novas primeiro).
  KEY ix_notes_user_archived_created (user_id, archived_at, created_at),
  -- Cobre a query do perfil publico, que filtra por visibilidade.
  KEY ix_notes_user_visibility (user_id, visibility, archived_at),
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  -- SET NULL: apagar uma tag nao pode apagar a nota junto.
  CONSTRAINT fk_notes_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
