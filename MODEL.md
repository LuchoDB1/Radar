# Radar — Modelo

> La constitución del proyecto. Cambia poco. Si esto cambia, hay que revisar todo lo que dependa.
> Última actualización: 2026-05-05

## Principio central

*Radar agrega y categoriza noticias RSS curadas del mundo IA y las sirve como un feed unificado y filtrable, sin requerir curaduría manual y sin bajarse por rate limits de feeds upstream.*

## Metáfora organizativa: cinta transportadora

El sistema funciona como una cinta transportadora unidireccional. Los feeds RSS upstream son la materia prima; un cron diario los consume, los procesa y los deposita en una base de datos cache. La UI lee desde esa base — **nunca consulta RSS en runtime**.

| Rol | Componente | Responsabilidad |
|-----|------------|-----------------|
| Recolector | `app/api/cron/route.ts` | fetch + parse RSS, upsert en Supabase |
| Parser | `lib/rss.ts` | normaliza XML/Atom a `NewsItem[]` |
| Categorizador | `lib/categories.ts` | infiere `Category` por keywords (determinístico) |
| Almacén | tabla `noticias` (Supabase) | fuente de verdad de noticias servidas |
| Vitrina | `app/page.tsx` + `components/NewsFeed.tsx` | renderiza el grid filtrable |
| Reporte | `app/api/report/route.ts` | genera HTML standalone con resumen por categoría |

## Mapa de autonomía

| Decisión | Quién |
|----------|-------|
| Disparar fetch diario de feeds | Vercel cron (autónomo, 09:00 ART = 12:00 UTC) |
| Categorizar una noticia | Sistema autónomo (keywords + source defaults) |
| Agregar/quitar fuente RSS | Humano (edita `lib/rss.ts` + commit) |
| Agregar/quitar categoría | Humano (edita `types/index.ts` + `lib/categories.ts`) |
| Tocar credenciales Supabase | Humano (env vars en Vercel) |

> Si una decisión marcada como "Humano" ocurre más de 3 veces por semana, reconsiderar si puede ser autónoma.

## Invariantes (no negociables)

1. **La app lee desde Supabase, no desde RSS upstream.** Solo `app/api/cron/route.ts` y `app/api/report/route.ts` (vía `lib/rss.ts`) tocan RSS — el resto del sistema lee de `lib/db.ts`. *Verificable*: grep de `getAllNews()` fuera de `api/cron|api/report|lib/rss` debe dar 0 hits.
2. **`revalidate = 3600` mínimo en cualquier fetch a RSS upstream.** Bajar este número expone al sistema a rate limits de feeds y rompe el principio central. *Verificable*: grep de `revalidate:` en `lib/rss.ts` y rutas API.
3. **El cron requiere autenticación con `CRON_SECRET`.** `/api/cron` rechaza requests sin `Authorization: Bearer ${CRON_SECRET}` con 401. *Verificable*: smoke test E2E.
4. **El `service_role` key de Supabase nunca se expone al cliente.** Solo `supabaseAdmin` (server-only) lo usa; el cliente usa `anonKey`. *Verificable*: `lib/supabase.ts` tiene split explícito + grep de `SUPABASE_SECRET_KEY` en código de cliente debe dar 0 hits.

> Cada invariante debe ser verificable: por linter, test, CHECK constraint, o `/audit`. Si no se puede verificar, no es invariante — es deseo.

## Principios derivados

**Decision: Supabase como cache intermedio entre RSS y UI** → porque el principio central exige *no bajarse por rate limits*. Si la app consultara RSS en runtime, cada visita al sitio dispararía 7 fetches a feeds externos; la cache desacopla el costo de fetch del tráfico de la UI.

**Decision: categorización determinística por keywords** → porque la metáfora exige *cinta transportadora* — cada noticia debe categorizarse de forma reproducible para que el cron diario produzca resultados consistentes ante reruns. Una categorización LLM rompería esto sin caching adicional. La feature "Resumen IA" del ROADMAP es ortogonal a esto: agrega información, no reemplaza la categorización.

**Decision: schema en español (`titulo`, `fuente`, `categoria`)** → porque el dominio del proyecto y el owner trabajan en español. El código TS usa nombres en inglés (`title`, `source`, `category`) y `lib/db.ts` traduce en el borde — esto mantiene el código alineado con convenciones JS sin imponer inglés al schema.

**Decision: Vercel cron como único productor** → porque no hay más fuentes de noticias. Si en el futuro se sumara ingestión manual o desde otra fuente, este invariante se debilita y debe documentarse en un ADR.

---

*Componentes, contratos y flujos detallados → [docs/architecture.md](docs/architecture.md)*
*Decisiones puntuales → [docs/decisions/](docs/decisions/)*
*Glosario → [docs/glossary.md](docs/glossary.md)*
