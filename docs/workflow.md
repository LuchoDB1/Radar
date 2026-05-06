# Workflow — Radar

> Cómo se mueve el trabajo a través del sistema. Capa 3 detallada.
> Última actualización: 2026-05-05

## Ciclo principal

Radar tiene **dos flujos paralelos**:

### Flujo cron (escritura, autónomo)

```
1. Vercel Cron dispara GET /api/cron a las 09:00 ART (cron expression: 0 12 * * * UTC)
2. /api/cron valida Authorization Bearer ${CRON_SECRET}
3. /api/cron llama getAllNews() — fetch paralelo a 7 RSS feeds (revalidate=3600)
4. lib/rss.ts parsea XML/Atom, normaliza a NewsItem[], categoriza determinísticamente
5. /api/cron mapea inglés → español y hace upsert a tabla noticias (onConflict=url)
6. /api/cron retorna { ok: true, fetched: N }
```

### Flujo UI (lectura, on-demand)

```
1. Usuario hace request a / (página principal)
2. app/page.tsx (Server Component) llama getAllNewsFromDB()
3. lib/db.ts hace SELECT noticias ORDER BY fecha_publicacion DESC LIMIT 200
4. SSR renderiza <NewsFeed news={NewsItem[]} />
5. NewsFeed (Client Component) muestra grid; FilterBar filtra por categoría client-side
```

## Loops de control

| Loop | Frecuencia | Qué hace en cada tick |
|------|-----------|----------------------|
| Vercel cron job | `0 12 * * *` UTC = 09:00 ART, daily | fetch 7 feeds → upsert a Supabase. Duración esperada: <60s (`maxDuration = 60` en `cron/route.ts`) |

> No hay otros loops. Si en el futuro se agrega refresh manual o ingestión por webhook, documentar acá.

## Estados detallados

```
upstream ──[cron tick]──→ fetched
fetched ──[título y url no vacíos]──→ categorized
fetched ──[título o url vacío]──→ dropped (no persistido)
categorized ──[upsert OK, url nueva]──→ upserted
categorized ──[upsert OK, url existente]──→ ignored (ignoreDuplicates: true)
```

No hay transición `failed` por noticia — un feed roto produce 0 items para ese feed, no items en estado fallido. La granularidad es **por feed**, no por noticia.

## Manejo de concurrencia

| Recurso compartido | Estrategia | Quién lo enforza |
|-------------------|-----------|------------------|
| tabla `noticias` (escritura) | UNIQUE constraint en columna `url` + `onConflict: "url"` en upsert | Postgres + Supabase client |
| 7 fetches a feeds RSS | `Promise.allSettled` — independientes, sin coordinación | `lib/rss.ts:getAllNews` |
| Cron concurrente | Vercel garantiza no overlap (un cron job a la vez por path) | Vercel Cron infra |

> **Edge case conocido**: si Vercel Cron se ejecuta y a la vez alguien hace `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron`, podrían ocurrir dos upserts simultáneos. Como ambos usan el mismo `onConflict: "url"`, la integridad se preserva — solo se duplica el costo.

## Cadencia de operación

| Operación | Frecuencia | Quién la dispara | Quién la consume |
|-----------|-----------|------------------|------------------|
| Fetch + categorizar + upsert | 1x/día (09:00 ART) | Vercel Cron | tabla `noticias` |
| Lectura UI | on-demand (cada page hit) | usuario | `app/page.tsx` |
| Lectura `/api/report` | on-demand (manual) | humano (curl o navegador) | logs / inspección |

## Manejo de errores

### Errores recuperables

Radar **no implementa retries explícitos**. La recuperación es por la cadencia diaria:

- Feed RSS caído → `parseFeed` retorna `[]` → próximo cron (24h después) reintenta
- Supabase 5xx temporal → `/api/cron` retorna 500 → próximo cron reintenta
- Parse error en un item → `extractTag` retorna `""`, item dropped por filtro `title && url`

> Item en ROADMAP "Error handling feeds — agregar retry automático" (alta prioridad) cubrirá este gap.

### Errores no recuperables

- Auth inválida en cron → 401, log, sin reintento
- `CRON_SECRET` no configurado en env → cron siempre falla con 401 hasta que humano lo arregla
- `SUPABASE_SECRET_KEY` no configurado → `supabaseAdmin` cae back a `anon` que no puede escribir → upsert falla con error de permisos

## Notificaciones y alertas

**Estado actual: no hay alertas custom configuradas.**

| Evento | Severidad | Canal | Audiencia |
|--------|----------|-------|-----------|
| Cron exitoso | info | Vercel logs | (nadie monitorea proactivamente) |
| Cron 401 | warning | Vercel logs | (nadie monitorea proactivamente) |
| Cron 500 | error | Vercel logs | (nadie monitorea proactivamente) |
| Feed individual caído | info | Vercel logs (un commit `monitor: feed down detected` aparece a veces — automático del cron) | logs |

> **Gap conocido**: no hay alerta proactiva al owner si el cron falla N días seguidos. Candidato a runbook + alerta básica (Vercel notif o email) cuando se cierre el item de error handling del ROADMAP.

## Métricas operacionales

**Estado actual: no hay métricas instrumentadas.**

Las únicas señales observables son los logs de Vercel y el conteo de noticias visible en el header de la UI (`{news.length} noticias`).

| Métrica candidata | Umbral verde | Umbral amarillo | Umbral rojo |
|---------|-------------|-----------------|-------------|
| Noticias upsertadas / cron run | >50 | 20-50 | <20 |
| Feeds caídos / cron run | 0-1 | 2-3 | >3 |
| Latencia del cron | <30s | 30-50s | >50s (cerca del `maxDuration=60`) |
| Días desde último upsert exitoso | 0-1 | 2 | ≥3 |

Todas estas son derivables de los logs de Vercel manualmente. Instrumentación automática es deuda futura.

---

*Componentes y contratos → [architecture.md](architecture.md)*
*Procedimientos operativos paso a paso → [runbooks/](runbooks/)*
