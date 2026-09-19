# AVISO INTENCIONAL: node:9.11.2 e EOL desde 2018 e nao recebe patch de
# seguranca. A versao esta pinada de proposito - este container representa o
# legado que sera estrangulado. Sobe no compose local e na VM do lab, pela
# imagem publicada no Artifact Registry privado do projeto: nunca fora dele, e
# nunca como ponto de entrada direto - sempre atras da borda.
# Racional em docs/adr/0001-legado-em-runtime-eol.md.
FROM node:9.11.2-slim

WORKDIR /app

# npm 5.6 nao tem `npm ci`: o lockfile commitado e o que garante reprodutibilidade.
COPY package.json package-lock.json ./
RUN npm install --production --no-audit && npm cache clean --force

COPY src ./src

USER node

ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
