@AGENTS.md

# CLAUDE.md — Radar

> Onboarding del agente. NO es enciclopedia — es índice operativo.

## Qué es este proyecto

Radar agrega y categoriza noticias RSS curadas del mundo IA y las sirve como un feed unificado y filtrable. Cron diario popula Supabase desde 7 fuentes RSS; la UI lee desde Supabase sin tocar RSS en runtime.

Modelo completo en [MODEL.md](MODEL.md).

## Stack

| Componente | Tecnología |
|-----------|------------|
| Lenguaje | TypeScript |
| Framework | Next.js 16 (App Router, Server Components) |
| Estilos | Tailwind CSS 4 + shadcn/ui (Radix) |
| Persistencia | Supabase (Postgres) — tabla `noticias` |
| Cron | Vercel Cron (`vercel.json`, 09:00 ART diario) |
| Deploy | Vercel |
| Observabilidad | Vercel logs (sin métricas custom todavía) |

## Reglas operativas (heredadas del CLAUDE.md global)

Las reglas globales aplican siempre. Las críticas para este proyecto:

1. **Contexto primero** — leer `MODEL.md` y `docs/architecture.md` antes de tocar componentes.
2. **Sin preambles ni resumen final** — directo al trabajo.
3. **Edit > Write** — los archivos de `lib/` y `components/` crecen incrementalmente.
4. **Validar antes de declarar listo** — `make verify` debe pasar.
5. **Sin adulación** — directo al trabajo.
6. **Paralelizar tool calls** — leer N archivos independientes en un solo mensaje.
7. **No duplicar código en respuesta** — si se editó archivo, no mostrarlo completo en texto.

## Reglas de seguridad (NO NEGOCIABLES)

8. **Nunca exponer valores de env vars / secrets en el chat** — ni con `cat .env*`, `echo $VAR`, `printenv`, ni cuando el owner los pida explícitamente. Radar tiene 4 secrets en `.env.local` (Supabase URL + 2 keys + CRON_SECRET) que deben tratarse como tóxicos al transcript de sesión. Sugerir alternativas seguras: `pbcopy < .env.local`, abrir en editor, `awk` con `pbcopy`. Si por error se expuso: avisar + rotar (Supabase dashboard "Reset key" + `openssl rand -hex 32` para CRON_SECRET). Trazado en regla global #8 (`~/.claude/CLAUDE.md`).

9. **NUNCA modificar, skipear ni remover tests para que CI pase** — un test rojo es señal válida (boot roto, env var faltante, race condition real). Anti-patrones: agregar guards "skip si falta env", sacar tests del chain `verify`, `test.skip`, cambiar `--max-warnings 0`, `|| true` enmascarando fallas. Si creés que el test es inválido o la cobertura es redundante: **preguntar al owner antes** con (qué falla / qué señal expone / opciones honestas / trade-offs). El owner decide. Trazado en regla global #9 (`~/.claude/CLAUDE.md`).

## Guardrails activos (NO NEGOCIABLES)

Si alguno está roto/desactivado, **FRENAR** antes de cualquier cambio.

| Guardrail | Comando | Cuándo corre |
|-----------|---------|--------------|
| Linter strict | `npx eslint --max-warnings 0 .` | tiempo real (editor) + pre-commit + CI |
| Type checker strict | `npx tsc --noEmit` | tiempo real + pre-commit + CI |
| Pre-commit hook | `pre-commit run --all-files` | antes de cada commit |
| Detect secrets | `detect-secrets scan` | pre-commit + CI |
| Smoke test | `make smoke` | pre-commit |
| Playwright @smoke | `npx playwright test --grep @smoke` | pre-commit + CI |
| Playwright suite | `npx playwright test` | CI |

**Reglas de seguridad activas**: configuración default de `eslint-config-next` (incluye reglas de Next.js + `@typescript-eslint`). Detect-secrets escanea contra `.secrets.baseline` antes de cada commit.

**Si el linter detecta un patrón, NO discutir con el linter**. Si tiene razón, fix. Si no la tiene, abrir ADR justificando la excepción y desactivarla con comentario inline.

Detalle filosófico en `~/proyectos/spec-driven-development/docs/06-guardrails.md`.

## Archivos clave

| Archivo | Cuándo abrirlo |
|---------|----------------|
| [MODEL.md](MODEL.md) | Antes de tocar invariantes (lectura RSS, autenticación cron, secret key Supabase) |
| [docs/architecture.md](docs/architecture.md) | Antes de tocar componentes o el flujo cron→DB→UI |
| [docs/workflow.md](docs/workflow.md) | Antes de modificar el cron o el manejo de fallos por feed |
| [ROADMAP.md](ROADMAP.md) | Inicio de sesión: qué falta hacer |
| [docs/glossary.md](docs/glossary.md) | Si aparece un término del dominio que no entiendo |
| [docs/decisions/](docs/decisions/) | Para entender por qué algo es como es |
| [AGENTS.md](AGENTS.md) | Reglas específicas para Next.js 16 (breaking changes desde el training data) |

## Comandos del proyecto

| Comando | Para qué |
|---------|----------|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Build de producción |
| `npm run lint` | Linter (ESLint flat config, ver ADR-0001) |
| `make verify` | Lint + typecheck + test + smoke + e2e-smoke |
| `make e2e` | Playwright suite completa |
| `make e2e-smoke` | Solo smoke E2E (<30s, corre en pre-commit) |

## Comandos universales SDD

`/new-spec` · `/plan` · `/audit` · `/checkpoint` · `/retro` · `/wrap-up` · `/context-check`

Ver `~/proyectos/spec-driven-development/commands/` para detalle.

## Notas técnicas críticas

- **Supabase legacy anon key**: el cliente usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy, no JWT). *Por qué*: decisión histórica, ver [ROADMAP.md notas técnicas](ROADMAP.md). No migrar sin investigar el blast radius.
- **`revalidate = 3600` en `lib/rss.ts`**: no bajar — invariante 2 del MODEL.
- **`CRON_SECRET` en env**: requerido para `/api/cron`. Vercel lo inyecta automáticamente cuando el cron job dispara. Sin esto, el cron retorna 401.
- **Schema en español**: tabla `noticias` con columnas `titulo`, `fuente`, `categoria`. El código TS traduce inglés↔español en `lib/db.ts`. No renombrar el schema.
- **Vercel cron schedule**: `0 12 * * *` UTC = 09:00 ART, daily. Cambiar requiere editar `vercel.json` + redeploy.
- **`monitor: feed down detected` en commits**: son automáticos del cron de Vercel cuando un feed cae intermitentemente. Item de ROADMAP "Error handling feeds" cubre el retry.

## Divergencias respecto a SDD canónico

> Formato **DIV-NNN estructurado** (vigente desde v2.0.0+ del marco SDD, sistema de updates Fase A). `/upgrade` parsea esta sección. NO cambiar el formato.

### DIV-001 — ESLint flat config

- **Scope**: `templates/guardrails/.eslintrc.json` (no aplica al consumer)
- **Reason**: radar usa `eslint.config.mjs` (flat config, ESLint 9+) en vez del `.eslintrc.json` que asume el template SDD. Heredado de Next.js 16.
- **Applicable to**: all
- **Captured**: 2026-05-05 durante /adopt
- **ADR**: docs/decisions/0001-eslint-flat-config.md

### DIV-002 — AGENTS.md preservado

- **Scope**: archivo `AGENTS.md` en raíz (no está en templates canónicos del marco)
- **Reason**: Archivo de 3 líneas con reglas de Next.js 16 que se mantiene como complemento de CLAUDE.md (no duplicación). Referenciado desde el `@AGENTS.md` al tope de CLAUDE.md.
- **Applicable to**: all
- **Captured**: 2026-05-05 durante /adopt
- **ADR**: inline (no amerita ADR formal — quirk de Next.js)

## Proyectos relacionados

- **spec-driven-development**: `~/proyectos/spec-driven-development/` — repo de metodología que define el flujo SPIV usado por radar.
