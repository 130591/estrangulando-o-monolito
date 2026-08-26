# AVISO INTENCIONAL: node:9.11.2 e EOL desde 2018 e nao recebe patch de
# seguranca. A versao esta pinada de proposito - este container representa o
# legado que sera estrangulado. So sobe no compose local, nunca em registry
# nem exposto. Racional em docs/adr/0001-legado-em-runtime-eol.md.
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
