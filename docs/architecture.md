# Arquitectura — Radar

> Componentes, contratos, flujos y gates. Cambia con refactors mayores.
> Última actualización: 2026-05-05

## Diagrama del sistema

```
                                    ┌────────────────────────────────┐
                                    │    7 fuentes RSS upstream      │
                                    │  (The Verge, Ars, OpenAI, ...) │
                                    └─────────────┬──────────────────┘
                                                  │ fetch (revalidate=3600)
                                                  ▼
        ┌──────────────────────────────────────────────────────────┐
        │  app/api/cron/route.ts  (Vercel Cron, 09:00 ART daily)   │
        │  ─ valida CRON_SECRET                                    │
        │  ─ getAllNews() vía lib/rss.ts                           │
        │  ─ upsert(noticias, onConflict=url, ignoreDuplicates)    │
        └─────────────────────────────┬────────────────────────────┘
                                      │ supabaseAdmin (secret key)
                                      ▼
                            ┌─────────────────────┐
                            │  Supabase Postgres  │  ← FUENTE DE VERDAD
                            │  tabla: noticias    │
                            └──────────┬──────────┘
                                       │ supabase (anon key, read-only)
                                       ▼
        ┌────────────────────────────────────────────────────────────┐
        │  app/page.tsx  (Server Component, default route)           │
        │  ─ getAllNewsFromDB() vía lib/db.ts                        │
        │  ─ pasa NewsItem[] a <NewsFeed/>                           │
        └────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ (HTML standalone, on-demand)
                            ┌──────────┴──────────┐
                            │ /api/report          │  ← excepción: lee RSS
                            │ (revalidate=0)       │     directo, sin cache
                            └──────────────────────┘
```

**Flujo unidireccional**: RSS → cron → Supabase → UI. La UI **nunca lee RSS** (excepción: `/api/report` para snapshot ad-hoc en HTML).

## Componentes

| Componente | Rol | Inputs | Outputs | Constraints | Invariante |
|-----------|-----|--------|---------|-------------|------------|
| `app/api/cron/route.ts` | Recolector — único productor de filas en `noticias` | `Authorization: Bearer ${CRON_SECRET}` header | upsert a tabla `noticias` + JSON `{ ok, fetched }` | NO retornar contenido sin auth (401) · NO bajar `revalidate` < 3600 en fetches | Si `error.length > 0`, retorna 500 + log; nunca silenciosamente falla |
| `lib/rss.ts` | Parser RSS/Atom | `RSSFeed[]` (hardcoded) | `NewsItem[]` ordenado por `publishedAt` desc | NO escribir a DB · NO usar libs pesadas (regex parsing manual) · `slice(0, 15)` por feed | `Promise.allSettled` — un feed roto NO debe romper el batch |
| `lib/categories.ts` | Categorizador determinístico | `title`, `summary`, `source` | `Category` | NO usar LLM o servicios externos · debe ser idempotente | Mismo input → mismo output siempre |
| `lib/supabase.ts` | Factory de clientes Supabase | env vars | `supabase` (anon) y `supabaseAdmin` (secret, fallback a anon) | `supabaseAdmin` solo en código server-side · NUNCA importar desde `app/page.tsx` o `components/` | `SUPABASE_SECRET_KEY` no expuesto al bundle del cliente |
| `lib/db.ts` | Lector tipado de Supabase | nada (lee env de `lib/supabase.ts`) | `NewsItem[]` (limit 200, ordenado por `fecha_publicacion` desc) | NO escribir a DB · solo `supabase` (anon) | Traduce schema español → tipo TS inglés |
| `app/page.tsx` | Vitrina (route default `/`) | `NewsItem[]` desde `lib/db.ts` | HTML SSR + `<NewsFeed/>` interactivo | Server Component por default · Client Component solo en filtros | No bloquea si DB vacía (renderiza grid vacío) |
| `app/api/report/route.ts` | Reporte HTML standalone | nada (vía `lib/rss.ts`) | HTML `text/html` con resumen por categoría | `revalidate = 0` (siempre fresco) · NO escribir a DB | Excepción documentada al invariante 1: lee RSS directo |
| `components/NewsFeed.tsx` + `FilterBar.tsx` + `NewsCard.tsx` | UI cliente (filtrado por categoría) | `NewsItem[]` props | DOM | Client Components (`"use client"`) · sin lógica de negocio | Categorías derivadas de `news`, no hardcodeadas |

## Contratos entre componentes

Todos viven en [types/index.ts](../types/index.ts):

```typescript
// types/index.ts
export type Category = "Modelos" | "Empresas" | "Research" | "Tools" | "Regulación" | "General"

export type Source = "The Verge" | "Ars Technica" | "VentureBeat" | "DeepMind"
                   | "OpenAI" | "Hugging Face" | "MIT Tech Review"

export interface NewsItem {
  id: string           // formato: `${source}-${index}-${pubDate}` (cron) | uuid (DB)
  title: string
  url: string          // único — usado como conflict key en upsert
  source: Source
  publishedAt: Date
  summary: string      // truncado a 220 chars en el parser
  category: Category
}
```

**Contrato Supabase (tabla `noticias`)**: schema en español, traducido por `lib/db.ts`:

| Columna TS (`NewsItem`) | Columna SQL (`noticias`) | Tipo SQL |
|---|---|---|
| `id` | `id` | `uuid` (auto) |
| `title` | `titulo` | `text` |
| `url` | `url` | `text` UNIQUE |
| `source` | `fuente` | `text` |
| `publishedAt` | `fecha_publicacion` | `timestamptz` |
| `summary` | `resumen` | `text` (nullable) |
| `category` | `categoria` | `text` (nullable, default `'General'`) |

## Flujo principal

### Flujo escritura (cron)

```
1. Vercel Cron dispara GET /api/cron a las 09:00 ART (12:00 UTC)
2. cron/route.ts valida `Authorization: Bearer ${CRON_SECRET}` → si falla, 401
3. lib/rss.ts.getAllNews():
   3a. Por cada FEED en FEEDS (7 hardcoded):
       - fetch con revalidate=3600
       - splitItems() detecta <item> (RSS) o <entry> (Atom)
       - extrae title, url, summary, pubDate
       - inferCategory(title, summary, source)
   3b. Promise.allSettled — feeds rotos retornan []
   3c. flatMap + filter por title&&url + sort por publishedAt desc
4. cron/route.ts mapea NewsItem → fila SQL (inglés → español)
5. supabaseAdmin.upsert(rows, { onConflict: "url", ignoreDuplicates: true })
6. Retorna { ok: true, fetched: news.length }
```

### Flujo lectura (UI)

```
1. Usuario navega a /
2. app/page.tsx (Server Component) llama getAllNewsFromDB()
3. lib/db.ts hace SELECT con limit 200, order by fecha_publicacion desc
4. Traduce schema → NewsItem[] (español → inglés)
5. SSR renderiza <NewsFeed news={news} />
6. NewsFeed (Client Component) filtra por categoría según selección del FilterBar
```

## Estados de unidad de trabajo

Una "unidad de trabajo" es una **noticia** procesada por el cron.

| Estado | Significado | Transición |
|--------|-------------|-----------|
| upstream | publicada en feed RSS | → fetched |
| fetched | descargada por `lib/rss.ts` | → categorized |
| categorized | con `Category` asignada | → upserted (ok) | dropped (sin title o url) |
| upserted | guardada en `noticias` | (terminal — ignored si url ya existe) |
| dropped | filtrada por title&&url vacío | (terminal — no se persiste) |

No hay estado `failed` por noticia individual — un feed que falla no produce items, no produce noticias en estado fallido.

## Manejo de fallos

| Tipo de fallo | Lo detecta | Acción | Notifica a |
|--------------|-----------|--------|-----------|
| Feed RSS upstream caído (timeout, 5xx, parse error) | `parseFeed()` `try/catch` | retorna `[]` para ese feed, sigue con los demás | logs (Vercel) |
| Todos los feeds vacíos | `cron/route.ts` chequea `news.length === 0` | retorna `{ ok: false, error: "No news fetched" }` (200) | logs |
| Auth inválida en cron | `cron/route.ts` chequea `authHeader` | retorna 401 | logs |
| Supabase upsert falla | `cron/route.ts` chequea `error` | retorna 500 + `error.message` | logs |
| DB vacía en lectura | `lib/db.ts` retorna `[]` | UI renderiza grid vacío sin error visible | (nada) |

## Gates de escalación

Radar es completamente autónomo en operación normal. **No hay gates** — el sistema procesa lo que llega; los humanos editan código (fuentes, categorías, schema) entre runs del cron.

> **Implicación**: si una noticia se categoriza mal, el humano edita `lib/categories.ts` y el próximo cron la re-categoriza al re-upsert (`onConflict: "url"`). No hay queue de revisión.

## Fronteras del sistema

**Adentro**:
- Fetch + parse de RSS de un set hardcoded de fuentes
- Categorización determinística de noticias
- Persistencia en Supabase
- UI grid filtrable por categoría
- Reporte HTML standalone

**Afuera**:
- Auth de usuarios → no hay
- Newsletter / push → ROADMAP (Resend)
- Resumen IA → ROADMAP (Claude Haiku)
- Búsqueda full-text → ROADMAP
- Feed RSS de salida (Radar como fuente) → ROADMAP
- Multi-tenant / dashboards personalizados → ROADMAP

## Fuente de verdad del estado

| Tipo de estado | Vive en | Quién puede escribir |
|---------------|---------|----------------------|
| Lista de fuentes RSS | `lib/rss.ts:FEEDS` (código) | Humano (edita + commit) |
| Keywords de categoría | `lib/categories.ts:keywordMap` | Humano |
| Source defaults | `lib/categories.ts:sourceDefaults` | Humano |
| Catálogo de noticias | tabla `noticias` (Supabase) | Solo `app/api/cron/route.ts` (vía `supabaseAdmin`) |
| Cron schedule | `vercel.json:crons` | Humano |
| Credenciales Supabase | env vars (Vercel) | Humano |

## Dependencias externas

| Sistema externo | Para qué | Modo de fallo si está caído |
|----------------|----------|-----------------------------|
| 7 feeds RSS upstream | input de noticias | `parseFeed` retorna `[]` por ese feed; los demás siguen. Si todos caen, cron retorna `{ ok: false }` |
| Supabase | persistencia | UI muestra grid vacío sin error visible al usuario; cron retorna 500 |
| Vercel Cron | trigger del fetch diario | sin fetch nuevo — la DB sigue sirviendo lo último que se guardó |
| Vercel deploy | hosting | sitio caído (página de error de Vercel) |

---

*Modelo conceptual y principio central → [../MODEL.md](../MODEL.md)*
*Glosario → [glossary.md](glossary.md)*
*Decisiones tomadas → [decisions/](decisions/)*
*Procedimientos operativos → [runbooks/](runbooks/)*
