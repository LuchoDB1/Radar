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

# Smoke: arranca next dev, espera que responda 200 en /, mata el server limpio.
# Usa `start-server-and-test` (3rd party) para coordinar el lifecycle del
# server externamente — maneja el cleanup del process tree robustamente,
# incluyendo grandchildren spawned por Next.js Turbopack. Esto reemplaza
# el cleanup manual con backgrounding + pkill + lsof que era frágil en
# Ubuntu CI (4 iteraciones de fix sin éxito 2026-05-11).
#
# Sintaxis: start-server-and-test <start-cmd> <ready-url> <test-cmd>
smoke:
	@echo "→ smoke: arrancando next dev + curl al boot..."
	@npx start-server-and-test "npm run dev" http://localhost:3000 \
	  "curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:3000 | grep -q 200 && echo '✅ smoke OK'"

e2e:
	npx playwright test

e2e-smoke:
	npx playwright test --grep @smoke

e2e-ui:
	npx playwright test --ui

clean:
	rm -rf .next test-results playwright-report node_modules/.cache
