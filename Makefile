# Atalhos do lab. Nenhum alvo aqui fala com o GCP: tudo roda offline.

SHELL := /bin/bash

COMPOSE_FILE := local/docker-compose.yml
# Usa o .env da raiz se ele existir; sem ele, os defaults do compose bastam.
ENV_FILE := $(wildcard .env)
COMPOSE := docker compose $(if $(ENV_FILE),--env-file .env,) -f $(COMPOSE_FILE)

TF_DIR := infra/terraform
NEW_APPS := new-service new-front

.DEFAULT_GOAL := help
.PHONY: help deps up down logs build reload lint test tf-validate

help: ## lista os alvos
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

deps: ## instala dependencias dos apps novos (o legado sobe sem install)
	@for app in $(NEW_APPS); do \
		echo "==> apps/$$app"; \
		npm ci --prefix apps/$$app; \
	done

up: ## sobe os 4 apps + a borda
	$(COMPOSE) up -d --build
	@echo
	@echo "  borda: http://localhost:${EDGE_PORT:-8080}/   (etapa 0: tudo no legado)"
	@echo "  o roteamento vive em local/nginx/nginx.conf"

down: ## derruba tudo (mantem o volume do mysql)
	$(COMPOSE) down --remove-orphans

logs: ## acompanha os logs (JSON; use | jq para ler)
	$(COMPOSE) logs -f --tail=100

build: ## rebuilda as imagens sem subir
	$(COMPOSE) build

reload: ## recarrega o URL map da borda sem derrubar os backends
	$(COMPOSE) exec edge nginx -t
	$(COMPOSE) exec edge nginx -s reload

lint: ## lint dos apps + checagem do URL map local
	@for app in $(NEW_APPS); do \
		echo "==> apps/$$app"; \
		npm run lint --prefix apps/$$app; \
	done
	@echo "==> local/nginx/nginx.conf"
	docker run --rm -v "$(CURDIR)/local/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.27-alpine nginx -t

test: ## testes dos apps
	@for app in $(NEW_APPS); do \
		echo "==> apps/$$app"; \
		npm test --prefix apps/$$app; \
	done

tf-validate: ## valida o terraform (init sem backend, nao toca em state)
	terraform -chdir=$(TF_DIR) fmt -recursive -check
	terraform -chdir=$(TF_DIR) init -backend=false -input=false
	terraform -chdir=$(TF_DIR) validate
