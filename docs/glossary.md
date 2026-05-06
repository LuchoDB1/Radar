# Glosario — Radar

> Vocabulario derivado de la metáfora *cinta transportadora* (MODEL.md). Define los términos que TODO el sistema usa de forma consistente.
> Última actualización: 2026-05-05

## Cómo usar este glosario

- Si un término aparece acá, **usalo así** en código, docs, commits, conversaciones
- Si encontrás un sinónimo en el código, **renombralo** o documentá la excepción
- Si necesitás un término nuevo, agregalo acá primero (con definición), después usalo

## Términos del dominio

### Noticia (`NewsItem`)

Unidad atómica que circula por la cinta. Un item de feed RSS upstream que pasó por el parser y la categorización. Tiene `id`, `title`, `url` (única), `source`, `publishedAt`, `summary`, `category`.

**Ejemplo**: *"El cron upserteó 87 noticias hoy."*

**Sinónimos a evitar**: artículo, post, entry, item. En el schema SQL aparece como `noticias` (en español) — esa es la única excepción al inglés en código.

### Fuente (`Source`)

Un proveedor RSS de la lista hardcoded en `lib/rss.ts:FEEDS`. Hoy hay 7: The Verge, Ars Technica, VentureBeat, DeepMind, OpenAI, Hugging Face, MIT Tech Review. El tipo TS `Source` es el unión de strings literales en `types/index.ts`.

**Ejemplo**: *"Agregar Anthropic Blog como fuente nueva."*

**Sinónimos a evitar**: feed (ambiguo — ver abajo), publisher, blog.

### Feed (RSS)

El recurso XML upstream en una URL. Cada `Source` tiene exactamente un `Feed` (URL). El término "feed" en este proyecto es **siempre upstream** — la UI no es un "feed" de Radar, es la "vitrina".

**Ejemplo**: *"El feed de Hugging Face cayó esta noche."*

**Sinónimos a evitar**: stream, channel, source (es distinto — ver arriba).

### Categoría (`Category`)

Etiqueta inferida por keywords. Hoy hay 6: `Modelos`, `Empresas`, `Research`, `Tools`, `Regulación`, `General`. `General` es el fallback cuando ningún keyword matchea y la `Source` no tiene `sourceDefault`.

**Ejemplo**: *"OpenAI por default cae en Empresas, salvo que el título tenga 'gpt' o 'claude' (entonces Modelos)."*

**Sinónimos a evitar**: tag, label, topic.

### Cron (Vercel Cron)

El job programado que dispara `GET /api/cron` a las 09:00 ART (`0 12 * * *` UTC). Cuando se dice "el cron" en este proyecto, siempre se refiere a este job.

**Ejemplo**: *"El cron de hoy fetcheó 7 feeds y upsertó 92 noticias."*

### Upsert

Operación de Supabase que inserta una fila nueva si la `url` no existe, o no hace nada si ya existe (`ignoreDuplicates: true`). Es la forma en que Radar implementa **deduplicación parcial** sin tener una etapa de dedup explícita.

**Ejemplo**: *"El upsert es nuestro mecanismo de dedup actual — no hay queue de revisión."*

> Nota: el ROADMAP marca "deduplicación" como pendiente porque hay casos no cubiertos por dedup-por-URL (ej: misma noticia con URLs canonicalizadas distintas).

## Términos técnicos del proyecto

### `supabase` vs `supabaseAdmin`

- `supabase` (`lib/supabase.ts`): cliente con `anonKey`. **Solo lectura**. Importable desde Server Components y Client Components.
- `supabaseAdmin` (`lib/supabase.ts`): cliente con `secretKey`. **Lectura + escritura**. Solo importable desde rutas API server-side. Si `SUPABASE_SECRET_KEY` no está en env, hace fallback a `supabase` (rompe escritura — comportamiento intencional para fail-loud).

### Schema español

Las columnas de la tabla `noticias` están en español (`titulo`, `fuente`, `categoria`, etc.). El tipo TS `NewsItem` está en inglés. La traducción ocurre en `lib/db.ts` (lectura) y en `app/api/cron/route.ts` (escritura). **No renombrar el schema sin migración explícita.**

### `revalidate = 3600`

Convención de Next.js. En `lib/rss.ts` indica que el fetch a un feed RSS se cachea por 1 hora. Bajar este número viola Invariante 2 del MODEL.

### `revalidate = 0`

Convención de Next.js. En `app/api/report/route.ts` indica que la respuesta nunca se cachea — cada request al endpoint hace fetch fresh a los 7 feeds. Es la **excepción documentada** al invariante 1 del MODEL.

## Términos de roles

| Rol | Quién es | Qué hace | Qué NO hace |
|-----|---------|---------|-------------|
| **Recolector** | `app/api/cron/route.ts` | autenticarse vía `CRON_SECRET`, llamar `getAllNews()`, upsert a `noticias` | leer la tabla, mostrar UI, parsear RSS directamente |
| **Parser** | `lib/rss.ts` | normalizar XML/Atom a `NewsItem[]`, llamar al categorizador | escribir a DB, importar Supabase, escalar feeds caídos |
| **Categorizador** | `lib/categories.ts` | inferir `Category` por keywords + source defaults | usar LLMs, hacer fetches, persistir |
| **Almacén** | tabla `noticias` (Supabase) | preservar noticias, enforzar UNIQUE en `url` | filtrar, ordenar de forma compleja, ejecutar lógica |
| **Vitrina** | `app/page.tsx` + `components/NewsFeed.tsx` | leer DB, renderizar grid, filtrar client-side por categoría | escribir a DB, fetchear RSS, hacer auth |
| **Reportero** | `app/api/report/route.ts` | generar HTML standalone con resumen | escribir a DB, ser fuente de verdad |

## Acrónimos

| Acrónimo | Significado | Contexto de uso |
|----------|-------------|-----------------|
| RSS | Really Simple Syndication | El protocolo de feeds upstream |
| ART | Argentina Time (UTC-3) | Timezone canónico del owner para horarios de cron |
| SSR | Server-Side Rendering | Cómo `app/page.tsx` se renderiza |
| ADR | Architecture Decision Record | Archivos en `docs/decisions/` |

## Términos del ecosistema externo

| Término externo | Sistema | Significado en este proyecto |
|----------------|---------|------------------------------|
| `Authorization: Bearer ...` | HTTP | Cómo Vercel Cron autentica a `/api/cron` con `CRON_SECRET` |
| `onConflict` | Supabase / Postgres | Cláusula del upsert — siempre `"url"` para Radar |
| `revalidate` | Next.js | TTL de cache de un fetch o ruta |
| Server Component / Client Component | Next.js App Router | Default es Server; `"use client"` opt-in |
| flat config | ESLint 9+ | Formato `eslint.config.mjs` que radar usa (ver [ADR-0001](decisions/0001-eslint-flat-config.md)) |

---

*Modelo conceptual y metáfora → [../MODEL.md](../MODEL.md)*
*Componentes que usan estos términos → [architecture.md](architecture.md)*
