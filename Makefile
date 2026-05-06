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

# Smoke: arranca next dev por 5s y verifica que responde 200 en /
smoke:
	@echo "→ smoke: arrancando next dev por 5s..."
	@(npm run dev > /tmp/radar-smoke.log 2>&1 & echo $$! > /tmp/radar-smoke.pid); \
	sleep 5; \
	if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q 200; then \
	  echo "✅ smoke OK"; STATUS=0; \
	else \
	  echo "❌ smoke FAIL"; cat /tmp/radar-smoke.log; STATUS=1; \
	fi; \
	kill $$(cat /tmp/radar-smoke.pid) 2>/dev/null; rm -f /tmp/radar-smoke.pid; exit $$STATUS

e2e:
	npx playwright test

e2e-smoke:
	npx playwright test --grep @smoke

e2e-ui:
	npx playwright test --ui

clean:
	rm -rf .next test-results playwright-report node_modules/.cache
