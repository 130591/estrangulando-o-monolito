# 0001 · Legado em runtime EOL

## Status

Aceito · 2026-09-08

## Contexto

O projeto original era um monólito Node.js com front AngularJS 1.x servido por
nginx, tudo numa única VM. O monólito rodava como processo do sistema, ao lado
do nginx que servia os estáticos de disco e fazia proxy de `/api`. **Não havia
container.**

A containerização do monólito veio depois, já durante a migração, como um passo
dela — não como ponto de partida. Este é um fato do projeto real que não está
registrado em nenhum outro lugar deste repositório, e é ele que explica por que
o laboratório parece começar adiantado em relação ao diagrama da etapa 0.

Este repositório é um laboratório: precisa subir inteiro num laptop com um
comando, sem tocar em nenhuma API do GCP e sem custo. Essa exigência empurra
tudo para o Docker Compose, inclusive o legado — que no original nunca esteve lá.

O legado roda Node 9.11.2, EOL desde 2018, sem patch de segurança há sete anos.
O `package-lock.json` está commitado e é o que sustenta a reprodutibilidade da
árvore de dependências, porque o npm 5.6 dessa imagem não tem `npm ci` — não
existe instalação estrita a partir do lock, só um `npm install` que o respeita
mas pode reescrevê-lo.

A etapa 0 do Strangler exige 100% do tráfego apontando para a VM, com o legado
atrás do Application Load Balancer. Para isso o legado precisa existir no GCP de
alguma forma.

## Decisão

**A VM do laboratório roda o mesmo Docker Compose que roda localmente**, com os
serviços `edge`, `legacy-front` e `legacy-api`. O legado não é provisionado bare
na VM.

**As imagens do legado são publicadas no Artifact Registry privado do projeto** e
puxadas de lá pela service account `monolito-vm`. Não são construídas na VM.

**"Nunca exposto" passa a significar "nunca como ponto de entrada direto".** O
legado sempre atende atrás de uma borda: o `edge` do compose hoje, o URL map do
Application Load Balancer depois. A regra é sobre topologia, não sobre
alcançabilidade de rede.

## Consequências

Aceitas:

- **O laboratório comprime um passo que o original fez depois.** A etapa 0 daqui
  não reproduz o diagrama do próprio README, onde a caixa da VM é `nginx +
  AngularJS + monólito` sem container. Quem ler o diagrama e o `vm.tf` lado a
  lado vai ver a divergência — ela é esta decisão, não um descuido.
- **Uma imagem de Node 9 EOL passa a existir num registry.** Scanner de
  vulnerabilidade vai apontá-la para sempre, e com razão. O repositório é privado
  e só a service account da VM tem `reader`, mas a imagem existe.
- **A VM carrega um container `edge` com prazo de validade conhecido.** Quando o
  ALB entrar, o URL map assume o papel dele e o container vira redundante.
- **Existe uma janela com a porta 8080 aberta a `0.0.0.0/0`** — o `allow-app` do
  `vm.tf` — enquanto o ALB não existe. É atalho declarado de laboratório, e morre
  junto com a entrada do ALB.

Ganhas:

- Um único caminho de deploy para todos os apps: build, push, pull. O
  `deploy.sh` não precisa de um caso especial para o legado.
- A imagem que roda é a imagem que foi testada — o que o `npm install` do npm 5.6
  não garantiria se o build acontecesse na VM.
- A VM não precisa de git, código-fonte nem toolchain de build.

## Alternativas consideradas

**Provisionar o legado bare na VM, fiel ao original** — nginx servindo `public/`
de disco e o monólito por systemd. Rejeitada: exigiria manter dois modelos de
deploy, bare para o legado e container para o resto, e o custo cai inteiro sobre
o tempo até chegar no URL map, que é o assunto central deste repositório.

**Começar bare e containerizar depois, como passo explícito da migração.** É o
que aconteceu no projeto real, e ensina o que nenhum dos dois extremos ensina:
descobrir dependência não declarada do host e provar paridade num cutover.
Rejeitada porque este legado é limpo demais para a lição valer o custo — o
`config.js` lê tudo de variável de ambiente, o banco é TCP e o log vai para
stdout. Não há acoplamento oculto a descobrir. Pode ser revisitada num ADR
futuro se o laboratório ganhar acoplamento de propósito.

**Construir as imagens na própria VM, a partir do fonte.** Rejeitada porque mover
o build para o momento do deploy faz o artefato que roda deixar de ser o artefato
que foi testado: cada build refaz o `npm install`, e sem `npm ci` não há
instalação estrita a partir do lock que garanta o mesmo resultado. "Não sei
exatamente o que tem dentro" é o pior lugar para estar num container sem patch há
sete anos.
