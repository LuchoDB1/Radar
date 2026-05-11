# Radar — Makefile (adaptado del template SDD para stack Next.js + TS)
# `make verify` es la pre-condición de cualquier commit.

.PHONY: help install verify lint typecheck test test-critical smoke e2e e2e-smoke e2e-ui clean

help:
	@echo "Comandos disponibles:"
	@echo "  make install       Instala dependencias y activa pre-commit hook"
	@echo "  make verify        Lint + typecheck + smoke + e2e-smoke (pre-condición de commit)"
	@echo "  make lint          ESLint strict (flat config, no warnings)"
	@echo "  make typecheck     TypeScript strict (--noEmit)"
	@echo "  make test          Tests unitarios (TODO: pendiente — no hay test framework todavía)"
	@echo "  make smoke         Smoke test (boot del servidor por 5s)"
	@echo "  make e2e           Playwright suite completa"
	@echo "  make e2e-smoke     Solo tests con tag @smoke (rápidos, pre-commit)"
	@echo "  make e2e-ui        Playwright en modo UI (debug)"
	@echo "  make clean         Borra .next, test-results, playwright-report"

install:
	npm ci
	pre-commit install
	@echo "✅ Guardrails activos"

verify: lint typecheck smoke e2e-smoke
	@echo "✅ verify pasó"

lint:
	npx eslint . --max-warnings 0

typecheck:
	npx tsc --noEmit

test:
	@echo "⚠️  No hay test framework configurado todavía. Ver ROADMAP."
	@exit 0

test-critical:
	@echo "⚠️  No hay test framework configurado todavía."
	@exit 0

# Smoke: arranca next dev por 5s y verifica que responde 200 en /.
# Cleanup robusto: matar `npm` + child `next dev` por nombre + esperar
# que el puerto 3000 se libere antes de salir. Sin esto, el target
# siguiente (`e2e-smoke`) que invoca Playwright con `reuseExistingServer:
# !isCI` (false en CI) choca con un proceso zombi en :3000 y falla con
# "address already in use". Detectado en CI run 25689237593 (radar
# 2026-05-11).
smoke:
	@echo "→ smoke: arrancando next dev por 5s..."
	@(npm run dev > /tmp/radar-smoke.log 2>&1 & echo $$! > /tmp/radar-smoke.pid); \
	sleep 5; \
	if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q 200; then \
	  echo "✅ smoke OK"; STATUS=0; \
	else \
	  echo "❌ smoke FAIL"; cat /tmp/radar-smoke.log; STATUS=1; \
	fi; \
	NPM_PID=$$(cat /tmp/radar-smoke.pid); \
	pkill -TERM -P $$NPM_PID 2>/dev/null || true; \
	kill -TERM $$NPM_PID 2>/dev/null || true; \
	sleep 2; \
	pkill -KILL -P $$NPM_PID 2>/dev/null || true; \
	kill -KILL $$NPM_PID 2>/dev/null || true; \
	for i in 1 2 3 4 5; do \
	  if ! (lsof -i :3000 -t 2>/dev/null | grep -q .); then break; fi; \
	  sleep 1; \
	done; \
	rm -f /tmp/radar-smoke.pid; exit $$STATUS

e2e:
	npx playwright test

e2e-smoke:
	npx playwright test --grep @smoke

e2e-ui:
	npx playwright test --ui

clean:
	rm -rf .next test-results playwright-report node_modules/.cache
