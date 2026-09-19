# Backlog do estrangulamento

> **Provisionar à mão primeiro, codificar depois.** Errar dentro de um startup
> script custa um ciclo de recriação de VM por tentativa, e o log fica escondido
> no syslog do convidado.

Levar o `legacy-front` e o `legacy-api` do compose local até a VM no GCP. Cada
critério de aceite é um comando que se roda e uma saída que se lê — não um
"está funcionando".

A numeração dos épicos é ordem de dependência, não prioridade: o épico 4 não
tem como começar antes do 1 fechar.

| # | Épico | Estórias | Estado |
|---|-------|----------|--------|
| 1 | [Decidir antes de provisionar](#1--decidir-antes-de-provisionar) | LAB-01 | **fechado** |
| 2 | [Chegar na VM](#2--chegar-na-vm) | LAB-02 → LAB-03 | aberto |
| 3 | [Deixar o banco de pé](#3--deixar-o-banco-de-pé) | LAB-04 → LAB-06 | aberto |
| 4 | [Levar o código para a VM](#4--levar-o-código-para-a-vm) | LAB-07 → LAB-08 | aberto |
| 5 | [Subir o legado](#5--subir-o-legado) | LAB-09 → LAB-11 | aberto |
| 6 | [Devolver o aprendizado ao código](#6--devolver-o-aprendizado-ao-código) | LAB-12 → LAB-15 | aberto |
| 7 | [Depois: a etapa 0 de verdade](#7--depois-a-etapa-0-de-verdade) | LAB-16 → LAB-17 | não agora |

Placeholders em `<MAIÚSCULAS>` você substitui.
Projeto `gcp-migration-506723` · região `us-central1` · zona `us-central1-a`.

---

## 1 — Decidir antes de provisionar

O ADR 0001 era citado em quatro arquivos e não existia em nenhum. Sem ele, a
LAB-08 tinha dois caminhos possíveis e nenhum critério para escolher.

### LAB-01 · Fixar o ADR 0001

`~20 min` · **fechado**

**Como** dev do lab, **quero** registrar por escrito como o legado chega à VM,
**para** o repo parar de deixar essa decisão implícita.

- [x] `docs/adr/0001-legado-em-runtime-eol.md` existe
- [x] O contexto registra que, no projeto real, a containerização do monólito veio **durante** a migração — fato que não estava em lugar nenhum do repo
- [x] A decisão diz o que "nunca exposto" significa: nunca como ponto de entrada direto, sempre atrás da borda
- [x] A decisão nomeia o caminho da LAB-08: Artifact Registry privado, imagem nunca construída na VM
- [x] Os arquivos que a decisão tornou falsos foram corrigidos: `README.md`, `apps/legacy-api/Dockerfile` e `scripts/deploy.sh`

> **Decidido:** a VM roda o mesmo compose do local — compressão declarada, não
> fidelidade ao original. As imagens vêm do Artifact Registry. "Exposto" quer
> dizer ponto de entrada direto, então o `allow-app` em `0.0.0.0/0` é atalho de
> lab com morte marcada na LAB-16.
>
> Não havia contradição a resolver, ao contrário do que este backlog dizia antes:
> os cinco call sites concordavam entre si, e o [README.md:191](../README.md#L191)
> era explícito em "o Node 9 nunca sai do compose local". Quem mudou isso foi a
> decisão, não a descoberta de um conflito. O `package.json` e o
> `docker-compose.yml` citam o ADR mas não afirmavam nada que a decisão tornasse
> falso — ficaram como estavam.

---

## 2 — Chegar na VM

A VM sobe crua: Ubuntu 24.04 e nada mais. Não há startup script, não há Docker,
não há código.

### LAB-02 · Entrar na VM pelo IAP

`~15 min`

**Como** dev do lab, **quero** abrir um shell na VM, **para** poder provisionar
à mão antes de automatizar.

- [ ] O comando abre um shell e `hostname` responde `monolito-legacy`
- [ ] Sei explicar por que sem `--tunnel-through-iap` o comando pendura até dar timeout
- [ ] Minha conta tem `roles/iap.tunnelResourceAccessor`, ou o Owner cobrindo

```bash
# a faixa 35.235.240.0/20 do allow-ssh é o IAP, não a internet
gcloud compute ssh monolito-legacy \
  --zone=us-central1-a --tunnel-through-iap

# se pendurar, confirme a role:
gcloud projects get-iam-policy gcp-migration-506723 \
  --flatten='bindings[].members' \
  --filter='bindings.members:<SUA_CONTA>' \
  --format='value(bindings.role)'
```

> A primeira conexão demora: o gcloud gera o par de chaves e propaga a chave
> pública nos metadados do projeto antes de abrir o túnel.

### LAB-03 · Docker rodando na VM

`~20 min`

**Como** dev do lab, **quero** Docker Engine e o plugin compose instalados na
VM, **para** subir lá a mesma topologia de borda que já roda no compose local.

- [ ] `docker run --rm hello-world` roda sem `sudo`
- [ ] `docker compose version` responde — plugin v2, não o `docker-compose` antigo
- [ ] Anotei cada comando que usei; essa lista é a entrada da LAB-12

```bash
# na VM
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
exec newgrp docker

docker run --rm hello-world
docker compose version
```

> O script de conveniência serve para um lab. O caminho de produção é o
> repositório apt oficial da Docker com a chave GPG — vale ler a diferença antes
> de decidir o que vai para o startup script na LAB-12.

---

## 3 — Deixar o banco de pé

O Cloud SQL sobe vazio. O `docker-entrypoint-initdb.d` que popula o banco local
só roda na primeira subida do volume do container e não existe fora do compose.

### LAB-04 · Provar a rota privada até o Cloud SQL

`~15 min`

**Como** dev do lab, **quero** confirmar que a VM alcança o Cloud SQL pelo IP
privado e que a minha máquina não alcança, **para** entender na prática o que o
peering de service networking comprou.

- [ ] O describe devolve um endereço `10.x.x.x` e nenhum IP público
- [ ] Da VM: a porta 3306 conecta
- [ ] Da minha máquina: o mesmo comando falha — e essa falha é o resultado esperado, não um problema

```bash
gcloud sql instances describe monolito-mysql \
  --format='value(ipAddresses[].ipAddress)'

# na VM
nc -zv <IP_PRIVADO> 3306
```

> É o `ipv4_enabled = false` do `sql.tf` que produz esse comportamento. A VM só
> chega lá porque está na mesma VPC que o peering conectou.

### LAB-05 · Schema e seed dentro do Cloud SQL

`~30 min`

**Como** dev do lab, **quero** as tabelas e o seed aplicados no Cloud SQL,
**para** o legado não subir e morrer na primeira query.

- [ ] `SHOW TABLES` lista as três: `users`, `tags` e `notes`
- [ ] A contagem de linhas bate com o que o `002-seed.sql` insere
- [ ] Documentei qual caminho usei: import via bucket ou pipe direto da VM

```bash
# caminho direto: da VM, com os .sql já lá
sudo apt-get install -y mysql-client
mysql -h <IP_PRIVADO> -u app -p app < 001-schema.sql
mysql -h <IP_PRIVADO> -u app -p app < 002-seed.sql

mysql -h <IP_PRIVADO> -u app -p app -e 'SHOW TABLES'
```

> O outro caminho é `gcloud sql import sql` a partir de um bucket, mais próximo
> do que se faz em produção — mas exige dar `objectViewer` à service account do
> Cloud SQL no bucket. Escolher um e saber por quê já é o aprendizado.

### LAB-06 · Validar o plugin de autenticação do usuário `app`

`~10 min`

**Como** dev do lab, **quero** confirmar que o usuário `app` autentica por
`mysql_native_password`, **para** o driver mysql 2.x do Node 9 não responder
`ER_NOT_SUPPORTED_AUTH_MODE` em toda query.

- [ ] Sei qual plugin o usuário `app` está usando
- [ ] Se divergir, sei qual dos dois lados consertar: o `database_flags` do `sql.tf` ou um `ALTER USER`

```bash
mysql -h <IP_PRIVADO> -u app -p -e \
  "SELECT user, host, plugin FROM mysql.user WHERE user='app'"
```

> Pode dar `Access denied`: no Cloud SQL o usuário da aplicação nem sempre lê
> `mysql.user`. Se der, o teste que vale é o driver conectando de fato, o que a
> LAB-11 verifica ponta a ponta.

---

## 4 — Levar o código para a VM

O ADR 0001 fechou o caminho: Artifact Registry privado do projeto, imagem nunca
construída na VM.

### LAB-07 · Garantir permissão de push no Artifact Registry

`~10 min`

**Como** dev do lab, **quero** confirmar que a minha conta pode escrever no
repositório `apps`, **para** não descobrir a falta de permissão no meio do
primeiro push.

- [ ] A minha conta tem `artifactregistry.writer`, ou Owner
- [ ] `gcloud auth configure-docker` gravou o helper para `us-central1-docker.pkg.dev`
- [ ] Entendi por que o `registry.tf` só declara o `reader` da service account da VM

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
gcloud artifacts repositories list --location=us-central1
```

> O `roles/artifactregistry.reader` do `registry.tf` é o lado do pull, para a
> VM. O writer é você, e não está declarado em lugar nenhum do Terraform.

### LAB-08 · Colocar as duas imagens do legado na VM

`~40 min`

**Como** dev do lab, **quero** o `legacy-front` e o `legacy-api` disponíveis
como imagem dentro da VM, **para** o compose de lá ter o que subir.

- [ ] `docker images` na VM lista as duas
- [ ] A tag carrega uma versão explícita, não `latest`
- [ ] O build saiu da minha máquina, não da VM — é o que o ADR 0001 exige

```bash
# da minha máquina
REG=us-central1-docker.pkg.dev/gcp-migration-506723/apps
docker build -t $REG/legacy-front:v1 apps/legacy-front
docker build -t $REG/legacy-api:v1   apps/legacy-api
docker push $REG/legacy-front:v1
docker push $REG/legacy-api:v1

# na VM
docker pull $REG/legacy-front:v1
docker pull $REG/legacy-api:v1
```

> A VM puxa usando a service account `monolito-vm`, que já tem o
> `artifactregistry.reader` do `registry.tf`. Se o pull falhar com 403 e a role
> estiver lá, o suspeito é o escopo da instância — o `vm.tf` pede
> `cloud-platform`, que cobre.

---

## 5 — Subir o legado

A borda tem que se comportar igual à local: mesmo roteamento, mesmo default para
o legado. O que muda é o banco sair de dentro do compose.

### LAB-09 · Escrever o compose da VM

`~30 min`

**Como** dev do lab, **quero** um compose que rode na VM sem o serviço `mysql`,
**para** a topologia da borda continuar idêntica à local com o banco fora do
compose.

- [ ] Não existe serviço `mysql`, e os três `depends_on: mysql` órfãos saíram junto
- [ ] `DB_HOST` é o IP privado do Cloud SQL, não a string `mysql`
- [ ] Sobem só `edge`, `legacy-front` e `legacy-api`; os apps novos ficam para depois
- [ ] O `local/nginx/nginx.conf` é montado no edge sem alteração nenhuma

> Cada serviço troca `build:` por `image:`, apontando para o Artifact Registry —
> a VM não constrói nada (ADR 0001). O `edge` continua sendo a imagem oficial do
> nginx com o `nginx.conf` montado por volume.

### LAB-10 · Levar os segredos sem commitar nada

`~15 min`

**Como** dev do lab, **quero** `JWT_SECRET` e a senha do banco disponíveis na
VM, **para** o `legacy-api` conseguir subir sem que nada disso entre no git.

- [ ] `git check-ignore -v` confirma que o arquivo de env da VM está ignorado
- [ ] O `JWT_SECRET` não é o valor de exemplo do `.env.example`
- [ ] Sei dizer onde isso deveria morar quando deixar de ser lab: Secret Manager

> O `config.js` chama `required('JWT_SECRET')`: sem a variável o processo morre
> no boot, não degrada. O sintoma é o container reiniciando em loop, e o motivo
> aparece só na primeira linha do log.

### LAB-11 · Legado de pé e alcançável de fora

`~30 min`

**Como** dev do lab, **quero** abrir o app pelo IP externo da VM e usar o Dev
Notes de verdade, **para** ter a etapa 0 funcionando antes de trocar o acesso
direto pelo Load Balancer.

- [ ] Os três containers aparecem `healthy` no `docker compose ps`
- [ ] `/` devolve o front do legado: a borda faz proxy para o `legacy-front`
- [ ] `/api/example/items` devolve JSON provando que quem atendeu foi o `legacy-api`
- [ ] Login, criar nota e criar tag funcionam ponta a ponta contra o Cloud SQL

```bash
IP=$(gcloud compute instances describe monolito-legacy \
  --zone=us-central1-a \
  --format='value(networkInterfaces[0].accessConfigs[0].natIP)')

curl -s -o /dev/null -w '%{http_code}\n' http://$IP:8080/
curl -s http://$IP:8080/api/example/items
```

> Não use `/healthz` pela borda para checar a API: o `app.use('/', healthRoutes)`
> monta essa rota na raiz, e a raiz pertence ao `legacy-front` no `nginx.conf` —
> quem responde ali é o front, com o healthz dele. A sonda que prova ownership
> de rota é `/api/example`, e foi para isso que ela existe.

---

## 6 — Devolver o aprendizado ao código

Só depois que funcionou à mão.

### LAB-12 · Virar o provisionamento manual em startup script

`~1 h` · **só faz sentido depois da LAB-11 passar**

**Como** dev do lab, **quero** o que fiz à mão declarado em
`metadata_startup_script` no `vm.tf`, **para** uma VM recriada do zero subir
sozinha, sem eu precisar lembrar de nada.

- [ ] Uma VM destruída e recriada chega sozinha ao estado da LAB-11
- [ ] Sei ler o resultado do script em `/var/log/syslog` dentro da VM
- [ ] O script é idempotente: rodar de novo não quebra nada

### LAB-13 · Declarar os outputs do Terraform

`~15 min`

**Como** dev do lab, **quero** um `outputs.tf` com o IP privado do Cloud SQL, o
IP externo da VM e a URL do registry, **para** parar de garimpar esses valores
no console e no describe toda vez.

- [ ] `terraform output` devolve os três
- [ ] O output do IP privado alimenta direto o `DB_HOST` da LAB-09

> Hoje não existe nenhum output declarado — é por isso que a LAB-04 precisa de um
> `gcloud sql instances describe` só para descobrir o endereço.

### LAB-14 · Ter um ciclo destroy/apply confiável

`~45 min`

**Como** dev do lab, **quero** um roteiro verificado de subir, usar e destruir,
**para** o lab custar quase nada e não deixar recurso órfão faturando.

- [ ] `terraform state list` sai vazio depois do destroy
- [ ] `gcloud compute disks list` e `gcloud compute addresses list` saem vazios
- [ ] Sei o que fazer quando o destroy do `google_service_networking_connection` falhar e travar a VPC atrás dele
- [ ] Decidi como lidar com o nome `monolito-mysql` ficar reservado por até uma semana depois do delete: sufixo aleatório ou esperar

```bash
terraform state list
gcloud sql instances list
gcloud compute instances list
gcloud compute disks list
gcloud compute addresses list
```

> Cloud SQL é o único item que custa de verdade nesta stack: o `e2-micro` em
> `us-central1` com disco `pd-standard` cai no free tier, e VPC, subnet,
> firewall, service account e o range interno de peering são gratuitos.

### LAB-15 · Apagar o `terraform.tfstate` órfão da raiz

`~2 min`

**Como** dev do lab, **quero** remover o `terraform.tfstate` vazio da raiz do
repo, **para** não confundir estado local morto com o state real que vive no GCS.

- [ ] O arquivo não existe mais
- [ ] Confirmei que o state que vale é o do backend GCS: bucket `estrangulando-monolito-tfstate`, prefixo `env/dev`

> São 181 bytes com zero recursos, sobra de antes do backend remoto. Está no
> `.gitignore`, então nunca foi commitado — só atrapalha na hora de conferir o
> que está de pé.

---

## 7 — Depois: a etapa 0 de verdade

O que está acima entrega o legado rodando na VM e alcançável pelo IP. A etapa 0
do README pede o tráfego entrando por um Application Load Balancer com URL map —
é aí que o roteamento deixa de ser um `nginx.conf` e vira infraestrutura.

### LAB-16 · Application Load Balancer com URL map

`backlog`

**Como** dev do lab, **quero** o tráfego entrando por um ALB externo cujo
`default_service` é a VM, **para** poder mover uma rota para outro backend
mudando uma regra, sem redeploy do legado.

- [ ] Instance group, health check, backend service, url map, target proxy e forwarding rule declarados no Terraform
- [ ] O URL map reproduz exatamente o que o `local/nginx/nginx.conf` faz hoje
- [ ] O acesso direto pela porta 8080 deixa de ser o caminho normal

### LAB-17 · Cloud NAT antes de tirar o IP externo

`backlog` · **tem que entrar junto com a LAB-16, não depois**

**Como** dev do lab, **quero** saída para a internet pela VM sem depender do IP
externo efêmero, **para** a VM continuar puxando imagem e pacote quando o ALB
virar a única porta de entrada.

- [ ] Cloud Router e Cloud NAT declarados no Terraform
- [ ] Com o `access_config` removido, a VM ainda faz `docker pull` e `apt-get update`

> Esta é a ordem que morde: remover o `access_config {}` sem NAT no lugar deixa a
> VM sem saída nenhuma, e você perde inclusive o caminho para consertar de dentro.
