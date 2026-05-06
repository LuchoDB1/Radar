# Radar

Feed agregado y categorizado de noticias RSS del mundo IA. Cron diario popula Supabase desde 7 fuentes; la UI lee desde Supabase y filtra por categoría.

## Estado

Producción — desplegado en Vercel. Backlog en [ROADMAP.md](ROADMAP.md).

## Cómo arrancarlo localmente

```bash
git clone git@github.com:LuchoDB1/radar.git  # o tu fork
cd radar

npm install

# Activar guardrails (obligatorio)
pre-commit install

# Configurar variables de entorno
cp .env.example .env.local
# Editar con valores reales:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   SUPABASE_SECRET_KEY=...   # solo para correr el cron localmente
#   CRON_SECRET=...           # solo para correr el cron localmente

# Arrancar
npm run dev
```

Abrir http://localhost:3000.

## Cómo trabajar con el código

Antes de cualquier cambio:
```bash
make verify  # corre lint + typecheck + test + smoke + e2e-smoke
```

El proyecto sigue la metodología **Spec-Driven Development** — toda feature no trivial pasa por SPEC → PLAN → IMPLEMENT → VERIFY. Detalle en `~/proyectos/spec-driven-development/docs/00-overview.md`.

## Documentación interna

| Doc | Para qué |
|-----|----------|
| [MODEL.md](MODEL.md) | Modelo del sistema: principio central, metáfora, invariantes |
| [docs/architecture.md](docs/architecture.md) | Componentes, contratos, flujos |
| [docs/workflow.md](docs/workflow.md) | Cómo se mueve el trabajo (cron → DB → UI) |
| [docs/glossary.md](docs/glossary.md) | Vocabulario del dominio |
| [docs/decisions/](docs/decisions/) | ADRs — por qué se decidió cada cosa |
| [docs/runbooks/](docs/runbooks/) | Procedimientos operativos |
| [CLAUDE.md](CLAUDE.md) | Onboarding del agente de código |
| [AGENTS.md](AGENTS.md) | Reglas de Next.js 16 para agentes |

## Stack

- Next.js 16 (App Router, Server Components)
- TypeScript estricto
- Tailwind CSS 4 + shadcn/ui (Radix)
- Supabase (Postgres) como cache de noticias
- Vercel Cron para el fetch diario

## Licencia

Privada.
