# edge-owns-the-route

Demonstração do **Strangler Pattern** no Google Cloud: migrar um monólito Node.js
com front-end AngularJS para Cloud Run e React, uma rota por vez, sem big bang e
com rollback de uma linha.

Não é um exercício teórico. É a reconstituição de uma migração real que conduzi a
partir de 2021, remontada com as ferramentas que existem hoje.

---

## A tese

> **O Load Balancer decide de quem é a rota. O runtime só executa.**

Toda a migração cabe nessa frase. Enquanto a borda for a única fonte de verdade
sobre ownership de rota, você pode mover uma capacidade por vez, validar em
produção e voltar atrás alterando uma regra — sem redeploy do legado, sem janela
de manutenção, sem coordenar times.

Três regras derivam disso e valem para todo o repositório:

1. Uma rota tem **um único dono por vez**.
2. Uma escrita tem **uma única fonte de verdade por vez**.
3. Toda mudança de ownership precisa de **observabilidade e rollback**.

---

## Contexto real

O projeto original era um monólito Node.js com front AngularJS 1.x rodando em VM.
A migração seguiu o Strangler: External Application Load Balancer na frente do
legado sem mudar comportamento, depois extração de capacidades para Cloud Run e
publicação incremental do front novo.

**A migração chegou a ~80% e parou por lá.**

Não por falha técnica. A regra de que *toda feature ou serviço novo já nasce na
stack nova* foi adotada desde o início — isso interrompeu o crescimento do
monólito, que é o que realmente importa. O que sobrou são módulos antigos,
estáveis, com dono definido e fronteira explícita. Terminar a migração nunca
venceu a disputa de prioridade contra as entregas de negócio, e essa foi uma
decisão correta: o custo de carregar aquele resto sempre foi menor que o custo de
não entregar o resto.

É por isso que o padrão funciona. Uma migração big bang travada em 80% é um
desastre. Um strangler parado em 80% é apenas um sistema com uma fronteira bem
desenhada.

---

## O que este repositório demonstra

- Roteamento de borda com **URL map**, backends heterogêneos no mesmo mapa:
  instance group (VM legada), Serverless NEG (Cloud Run) e backend bucket (front
  estático).
- **Cloud Run** com revisões, traffic split, canary e rollback explícito.
- **Terraform** como registro de ownership: cada mudança de dono de rota é um
  diff revisável e reversível.
- **Correlation id** atravessando LB → monólito → serviço novo.
- Política de cache e versionamento de assets que impede mistura de releases
  entre os dois front-ends.

---

## Arquitetura

### Antes

```
usuário → DNS → VM
                 ├── nginx → AngularJS (estático)
                 └── /api  → monólito Node.js
                              └── banco
```

Um host, um deploy, uma unidade de falha.

### Etapa 0 — a ponte

O legado inteiro entra atrás do Application Load Balancer, com 100% do tráfego
apontando para a VM. Nada muda para o usuário. Esta etapa sozinha valida DNS,
TLS, health checks, logs e rollback da borda — antes de existir qualquer risco.

### Durante

```
                     usuário
                        │
              ┌─────────▼──────────┐
              │  HTTPS App LB      │
              │  URL map · TLS     │
              └─────────┬──────────┘
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   /new/**        /api/example/**    default
   front-new      new-service        (/ e /api/**)
   backend        Cloud Run          │
   bucket         (Serverless NEG)   ▼
   (React)                       instance group
                                 ┌──────────────┐
                                 │ VM: nginx    │
                                 │ AngularJS +  │
                                 │ monólito     │
                                 └──────────────┘
                                        │
                                        ▼
                                      banco ◄── new-service
```

Pontos deliberados:

- **A VM é o `default_service`.** Toda rota não reivindicada cai nela. Você nunca
  precisa conhecer a lista completa do que o legado faz.
- **O banco continua compartilhado.** Separar dados é uma migração à parte, bem
  mais cara. Enquanto os dois lados escrevem na mesma tabela, vale a regra 2.
- **Backends de três tipos no mesmo URL map.** É aqui que mora a maior parte do
  aprendizado.

O estado final é a caixa da VM desaparecendo e o `default_service` deixando de
apontar para ela. A migração inteira cabe nesse diff.

---

## O aplicativo: dev notes

Uma demonstração de Strangler precisa de algo para estrangular. O repo serve um
app real — **dev notes**, um read-later com tags e perfil público — implementado
**por inteiro dos dois lados**, sobre **o mesmo banco e as mesmas tabelas**.

| Tela | O que faz |
|---|---|
| Landing | hero, captura de e-mail e vitrine com notas públicas reais |
| Entrar / criar conta | e-mail + senha, JWT |
| Dashboard | grade de notas, busca, filtro por tag, modal de criar/editar, arquivar |
| Arquivadas | as mesmas notas, fora do caminho |
| Perfil público | `/<username>`, sem sessão, só o que é público |

As duas implementações são independentes e equivalentes: mesmas rotas, mesmo
envelope de resposta, mesmos códigos de erro, mesmo layout pixel a pixel. É essa
equivalência que torna o corte uma decisão de roteamento, e não uma migração.

### Sessão que atravessa o corte

Os dois backends assinam o JWT com **o mesmo segredo** (`JWT_SECRET`), o mesmo
`iss`/`aud` e HS256. Um token emitido pelo monólito é aceito pelo serviço novo e
vice-versa. Os dois fronts guardam o token na **mesma chave** de `localStorage`
(`devnotes.token`) e, atrás da borda, estão na mesma origem — então quem entra em
`/` continua logado em `/new/`.

É o antídoto direto para a "sessão dividida" que este README lista como o
problema que mais atrasa o primeiro corte real. O claim `via` guarda quem emitiu
o token e aparece no menu da conta: dá para ver, na tela, de que lado a sessão
nasceu.

### O corte, quando acontecer

O URL map ainda está na etapa 0: `local/nginx/nginx.conf` é um `server {}` vazio,
com os TODOs de sempre. O app está pronto dos dois lados, mas **nada está
roteado** — é a borda que falta, não o código.

Quando ela existir, mover uma rota é uma `location` a mais:

```nginx
location /api/notes {
  proxy_pass http://new-service:8080;
}
```

Nada mais muda. A sessão continua valendo (mesmo segredo de JWT), as notas são as
mesmas linhas do mesmo banco, e o campo `source` de toda resposta passa a dizer
`new-service`. Remover a `location` é o rollback — literalmente a linha que o topo
deste README promete.

---

## Stacks

O contraste entre os dois lados é intencional e faz parte da demonstração.

| | Legado | Novo |
|---|---|---|
| Runtime | Node 9 (EOL) | Node 22 |
| Backend | Express 4, CommonJS | NestJS + TypeScript |
| Front | AngularJS 1.5 | React + Vite |
| Driver do banco | `mysql` 2.x (callbacks) | `mysql2/promise` |
| Auth | `jsonwebtoken` + `bcryptjs` | `@nestjs/jwt` + Passport + `bcryptjs` |
| Dependências do front | `/vendor` commitado | build com assets hasheados |
| Hospedagem | VM + nginx | Cloud Run + backend bucket |

O Node 9 é proposital e nunca sai do compose local. O front legado original usava
Bower; como o registro foi descontinuado, o equivalente aqui é um `/vendor`
commitado — mesmo comportamento prático, mesma ausência de build step.

---

## O que mudou do original (2021 → hoje)

A reconstituição usa as ferramentas atuais. Os deltas relevantes:

- **Container Registry (`gcr.io`) → Artifact Registry.** Na época o Artifact
  Registry era recente e não era o padrão.
- **Load Balancer clássico → `EXTERNAL_MANAGED`,** com `routeRules`, prioridades
  e URL rewrite. O mapa original usava apenas `pathRules`.
- **Serverless VPC Connector → Direct VPC egress** para acesso a rede privada.
- **`gsutil` → `gcloud storage`.**

---

## Trade-offs assumidos

Nenhuma arquitetura é de graça. Os custos reais desta:

- **Coexistência prolongada.** Dois pipelines, dois front-ends, componentes
  duplicados, e o time mantendo os dois. O Strangler troca risco por tempo e
  duplicação.
- **Sessão dividida.** Cookie do monólito e token do serviço novo precisam
  conviver. É o problema que mais atrasa o primeiro corte real. Aqui está
  resolvido com segredo de JWT compartilhado (ver *Sessão que atravessa o
  corte*), o que troca o problema por um acoplamento: girar o segredo vira uma
  operação coordenada entre os dois lados.
- **Banco compartilhado.** O serviço novo não é autônomo enquanto compartilhar
  schema e migrations com o legado. E o custo não para no schema: o driver
  `mysql` 2.x, único que roda em Node 9, não fala `caching_sha2_password`, então
  **o banco inteiro** é forçado a `mysql_native_password` — um plugin que o MySQL
  8.4 já entrega desligado e que o MySQL 9 removeu. O lado mais velho da
  coexistência dita a configuração do recurso compartilhado, e essa conta só é
  paga quando a VM morre.
- **Granularidade do URL map.** A borda roteia por path, não por regra de
  negócio. Migrar meio prefixo produz um mapa frágil.
- **Cold start.** Cloud Run parte do zero; a VM está sempre quente. `minScale`
  resolve e cobra por isso.

O modo de falha clássico do padrão não é o corte dar errado — é a migração parar
no meio e a coexistência virar permanente. Foi mais ou menos o que aconteceu no
projeto original, e o desenho aguentou.

---

## Como rodar

Toda a topologia sobe local, sem tocar em nenhuma API do GCP e sem custo. O
`nginx` do compose faz o papel do URL map: mesmo roteamento, mesmo default para o
legado.

```bash
make up      # sobe legado, novo e a borda
make logs
make down
```

O schema e o seed sobem junto com o MySQL, e o dev notes já nasce com uma conta:

| | |
|---|---|
| conta de demonstração | `mariana@devnotes.app` · `devnotes` |

**A borda ainda não roteia nada** (etapa 0), então não há endereço único que
sirva o app: os fronts sobem, mas nenhum deles alcança `/api` até o URL map
existir. Escrever esse mapa é o próximo passo, e os TODOs em
`local/nginx/nginx.conf` dizem quais rotas ele precisa cobrir.

O schema e o seed ficam em `local/mysql/init/` e rodam na primeira subida do
volume. Depois de mexer no SQL:

```bash
docker compose -f local/docker-compose.yml down --volumes
docker compose -f local/docker-compose.yml up -d
```

Terraform fica em `infra/terraform`, validável sem aplicar:

```bash
make tf-validate
```

---

## Estrutura

```
apps/
  legacy-api      Express 4 · Node 9 · CommonJS
  legacy-front    AngularJS 1.5 · sem build step
  new-service     NestJS · TypeScript · Node 22
  new-front       React · Vite
infra/terraform/  network · vm · cloudrun · backend-bucket · load-balancer
local/
  docker-compose.yml
  nginx/          o "URL map local" (é aqui que se muda o dono da rota)
  mysql/init/     schema + seed, compartilhados pelos dois backends
docs/adr/         decisões arquiteturais
scripts/
```

O CSS do dev notes é **byte a byte idêntico** em `legacy-front/public/app.css` e
`new-front/src/styles.css`. Não é descuido: as duas telas têm que sair iguais
enquanto a borda move rota por rota, e um pacote compartilhado criaria
acoplamento de build entre um front com build step e outro sem nenhum. É a
"duplicação de componentes" da seção de trade-offs — deliberada, e anotada no
cabeçalho dos dois arquivos.

---

## Decisões arquiteturais

Registradas em [`docs/adr/`](docs/adr/). As principais:

- Por que a borda, e não o runtime, é dona da rota
- Por que o legado roda em runtime EOL neste laboratório
- Por que o banco permanece compartilhado durante a coexistência
- Por que hostname separado antes de path-based routing

---

## Referências

- [Google Cloud — URL maps overview](https://cloud.google.com/load-balancing/docs/url-map-concepts)
- [Google Cloud — Serverless network endpoint groups](https://cloud.google.com/load-balancing/docs/negs/serverless-neg-concepts)
- [Google Cloud — Deploy container images to Cloud Run](https://cloud.google.com/run/docs/deploying)
- [Martin Fowler — Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)