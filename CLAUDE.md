@AGENTS.md

# Radar — AI News Feed

## Descripción
Feed de noticias del mundo de la IA. Agrega RSS de las fuentes más relevantes,
categoriza las noticias y las muestra en un grid filtrable.

## Stack
- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Sin base de datos — RSS parseado server-side con caché de Next.js

## Fuentes RSS
| Fuente | URL RSS |
|---|---|
| The Verge AI | https://www.theverge.com/ai-artificial-intelligence/rss/index.xml |
| Ars Technica AI | https://feeds.arstechnica.com/arstechnica/technology-lab |
| VentureBeat AI | https://feeds.feedburner.com/venturebeat/SZYF |
| DeepMind Blog | https://deepmind.google/blog/rss.xml |
| OpenAI Blog | https://openai.com/news/rss.xml |
| Hugging Face Blog | https://huggingface.co/blog/feed.xml |

## Categorías
- Modelos (GPT, Gemini, Claude, Llama, etc.)
- Empresas (OpenAI, Google, Meta, Anthropic, etc.)
- Research / Papers
- Tools / Productos
- Regulación

## Estructura de carpetas
- `app/` → páginas y layouts (App Router)
- `app/api/` → endpoints que parsean los RSS
- `components/` → componentes UI reutilizables
- `components/ui/` → componentes shadcn
- `lib/` → lógica de negocio (parseo RSS, categorización)
- `lib/rss.ts` → fetching y parseo de feeds
- `lib/categories.ts` → lógica de categorización
- `types/` → tipos TypeScript compartidos

## Convenciones
- Todos los componentes en TypeScript estricto
- Server Components por defecto, Client Components solo cuando hay interactividad
- Los RSS se fetchean server-side con `revalidate = 3600` (caché de 1 hora)
- Noticias ordenadas por fecha descendente
- No usar librerías pesadas — parseo RSS nativo con fetch + XML

## Comandos útiles
- `npm run dev` → servidor de desarrollo
- `npm run build` → build de producción
- `npm run lint` → linter

## Arquitectura de datos
Cada noticia tiene:
- title: string
- url: string
- source: string (nombre de la fuente)
- publishedAt: Date
- summary: string (descripción del RSS)
- category: Category (inferida por keywords)
