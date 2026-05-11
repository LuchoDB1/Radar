# Modelo de dominio — Radar

> Contrato del modelado del **problema** (Capa 2). Vive separado de la **solución técnica** (Capa 3 = `architecture.md`). Si modificás reglas del problema, cambia este archivo. Si modificás cómo implementás, cambia `architecture.md`.
> Última actualización: 2026-05-10
>
> **Si dudás dónde poner algo**: ¿el concepto sigue siendo verdadero aunque cambies de stack? Sí → acá. No → `architecture.md`.

## Trazado al principio central

> *Radar agrega y categoriza noticias RSS curadas del mundo IA y las sirve como un feed unificado y filtrable, sin requerir curaduría manual y sin bajarse por rate limits de feeds upstream.*

El modelo sostiene el principio así: el dominio gira en torno a **una sola entity** (`Noticia`) que pasa por un pipeline `fetched → categorized → upserted`. La invariante "categorizada determinísticamente antes de persistir" hace innecesaria la curaduría manual. La unicidad por `url` (dedup parcial) y el flujo unidireccional pull-based desacoplan el ritmo de los feeds upstream del ritmo de la UI — base para no sufrir rate limits.

## Bounded contexts

> Radar tiene **un solo bounded context** (`agregacion-de-noticias`). El vocabulario es consistente para backend, consumidores y curadores. El context map no aplica.

| Contexto | Propósito | Owner conceptual |
|---|---|---|
| `agregacion-de-noticias` | Procesar RSS curado, categorizar determinísticamente, persistir y servir noticias unificadas | Owner del producto |

---

## Contexto: agregacion-de-noticias

### Ubiquitous language del contexto

Términos core del contexto. Detalle completo en [glossary.md](glossary.md).

| Término | Definición corta |
|---|---|
| `Noticia` (`NewsItem`) | Unidad atómica que circula por la cinta. Tiene identidad por `url`. |
| `Fuente` (`Source`) | Proveedor RSS hardcoded (7 valores cerrados). VO. |
| `Categoria` (`Category`) | Etiqueta inferida determinísticamente (6 valores cerrados). VO. |
| `FechaPublicacion` | Timestamp UTC de cuándo publicó la fuente upstream. VO. |
| `Feed` | El recurso XML upstream en una URL — siempre upstream, nunca interno. |
| `Categorizador` | Rol del dominio que asigna `Categoria` con reglas curatoriales determinísticas. |
| `Recolector` | Rol del dominio que es la **única vía de entrada** de noticias al catálogo. |
| `Vitrina` | Rol del dominio que sirve el catálogo unificado y filtrable. |

### Entities

> Cosas con **identidad propia** que persisten en el tiempo. Tienen ID estable.

#### `Noticia` (`NewsItem`)

- **Identidad**: `url` (identidad natural y de negocio — UNIQUE constraint en DB) + `id` (uuid técnico generado en persistencia)
- **Atributos clave**: `titulo`, `url`, `fuente`, `fecha_publicacion`, `resumen`, `categoria`
- **Estados posibles** (state machine):
  - `upstream` — existe en el RSS de la `Fuente`, todavía no fue procesada
  - `fetched` — descargada y parseada
  - `categorized` — `Categoria` asignada por el Categorizador
  - `upserted` — persistida en el catálogo (terminal — single fila por `url`)
  - `dropped` — descartada por `titulo` o `url` vacíos (terminal — no se persiste)
- **Mapeo a código**: tipo TS en [types/index.ts](../types/index.ts), schema en SQL como tabla `noticias`, traducción inglés↔español en [lib/db.ts](../lib/db.ts) (escritura) y [lib/rss.ts](../lib/rss.ts) (parser)

### Value objects

> Cosas que valen por su **contenido**. Sin identidad. Inmutables.

| Value object | Contenido | Cuándo se usa |
|---|---|---|
| `Fuente` (`Source`) | Union literal cerrada de 7 strings: `"The Verge" \| "Ars Technica" \| "VentureBeat" \| "DeepMind" \| "OpenAI" \| "Hugging Face" \| "MIT Tech Review"` | Atributo de `Noticia`. Definida en `types/index.ts`. Hardcoded en `lib/rss.ts:FEEDS`. |
| `Categoria` (`Category`) | Union literal cerrada de 6 strings: `"Modelos" \| "Empresas" \| "Research" \| "Tools" \| "Regulación" \| "General"` | Atributo de `Noticia`. `General` es fallback determinístico. |
| `FechaPublicacion` | Timestamp UTC (`Date` en TS, `timestamptz` en SQL como `fecha_publicacion`) | Atributo de `Noticia`. Ordena la cinta cronológicamente. |

### Aggregates

> Grupos modificados como **unidad de consistencia**.

#### Aggregate: `Noticia`

- **Aggregate root**: `Noticia`
- **Miembros**: solo el root. Los VOs (`Fuente`, `Categoria`, `FechaPublicacion`) son atributos del root, no miembros separados del aggregate.
- **Invariantes protegidas**:
  - **I1**: *"Una `Noticia` no existe sin `titulo` y `url`."* — el filtro en `lib/rss.ts` impide pasar al estado `categorized` sin ambos campos.
  - **I2**: *"Una `Noticia` persistida tiene `Categoria` asignada."* — el flujo obligatorio `parse → inferCategory → upsert` lo enforza; `General` es fallback determinístico cuando ningún keyword matchea.
  - **I3**: *"Dos `Noticia` con misma `url` son la misma noticia."* — UNIQUE constraint en columna `url` + `onConflict: "url"` en upsert.
- **Reglas de modificación**:
  - **Creación**: única vía es el `Recolector` (cron). Ningún otro rol crea noticias.
  - **Re-procesamiento**: ver Pregunta abierta P1 abajo.
  - **Eliminación**: no contemplada en el dominio actual. No hay operación de "borrar noticia".
- **Mapeo a código**: el aggregate root como tipo vive en [types/index.ts](../types/index.ts); las operaciones del root viven en [app/api/cron/route.ts](../app/api/cron/route.ts) (creación) y [lib/db.ts](../lib/db.ts) (lectura).

### Domain events

> Eventos significativos del dominio expresados en **pasado**. **Latentes** en radar — declarados aunque hoy no haya consumidores explícitos, porque son hechos reales del dominio independientemente de la implementación pull-based actual.

| Evento | Cuándo se emite | Aggregate root que lo emite | Consumidores (hoy / potenciales) |
|---|---|---|---|
| `NoticiaUpserted` | El cron persiste una `Noticia` nueva en el catálogo (no se emite si la `url` ya existía, por `ignoreDuplicates: true` actual) | `Noticia` | Hoy: logs Vercel. Potenciales: feature newsletter (ROADMAP), feed RSS de salida (ROADMAP), push notifications. |
| `NoticiaDropped` | Una entrada del feed RSS no pasa la validación de `titulo`/`url` y queda fuera del catálogo | `Noticia` | Hoy: logs Vercel. Potenciales: feature "fuentes problemáticas" para detectar feeds con muchos drops. |
| `FeedFallido` | Un fetch a una `Fuente` RSS upstream falla (timeout, 5xx, parse error) — `parseFeed` retorna `[]` para esa fuente | (no es del aggregate `Noticia` — es evento del proceso de recolección a nivel de `Fuente`) | Hoy: logs Vercel. Potenciales: item ROADMAP "Error handling feeds" con retry policy. |

> Estos events **no se materializan como mensajes en código** (no hay event bus, no hay async messaging). Son hechos conceptuales del dominio. Si en el futuro emerge un consumidor real, se introducen como eventos de aplicación (Capa 3+).

### Reglas del contexto (invariantes globales del contexto)

Reglas que no caen en un aggregate específico sino que aplican al contexto entero. Hacen explícito el carácter **curado y determinístico** del dominio.

- **R1**: *"La cobertura de fuentes es cerrada y curada."* — Las 7 fuentes están hardcoded en `lib/rss.ts:FEEDS`. Agregar/quitar fuente es decisión humana (commit), no operación de runtime. Esta regla sostiene el principio central ("noticias curadas").
- **R2**: *"La categorización es determinística por keywords + source defaults."* — Vive en `lib/categories.ts:keywordMap` y `lib/categories.ts:sourceDefaults`. Mismo input → mismo output siempre. Sin LLMs, sin servicios externos en el path de categorización. Esta regla sostiene el principio central ("sin curaduría manual") y la metáfora ("cinta transportadora unidireccional reproducible").
- **R3**: *"El catálogo se popula únicamente desde el `Recolector` (cron)."* — Ningún otro rol del dominio crea noticias. La unicidad de productor es deseo del dominio actual; si en el futuro se agrega ingestión manual o desde otra fuente, esta regla se debilita y debe documentarse en un ADR.

---

## Preguntas abiertas

Decisiones del dominio que no están cerradas y van a definirse cuando emerja la necesidad.

- **P1** (pendiente — drift HVC2 detectado en /model-domain 2026-05-10): *"¿Una `Noticia` upserted es inmutable, o re-categorizable al re-procesarla?"*
  - **Tensión**: `docs/architecture.md` afirma *"si una noticia se categoriza mal, el humano edita `lib/categories.ts` y el próximo cron la re-categoriza al re-upsert"*. Pero el código real usa `supabaseAdmin.upsert(rows, { onConflict: "url", ignoreDuplicates: true })` — `ignoreDuplicates: true` significa que **el re-upsert NO actualiza filas existentes**, por lo tanto la re-categorización documentada **no ocurre**.
  - **Opciones**:
    - (A) Aceptar inmutabilidad post-upsert como invariante real → actualizar `architecture.md` para describir el comportamiento real + nueva invariante I4 *"Una `Noticia` upserted es inmutable. Para re-categorizar, hay que delete + insert manual."*
    - (B) Aceptar re-categorización como intención del dominio → bug en código: cambiar `ignoreDuplicates: true` a `false` (o usar `upsert` con `update` explícito de `categoria`) + nueva invariante I4 *"Una `Noticia` debe ser re-categorizable al re-procesarla."*
  - **Decisión**: pendiente del owner. Captura honesta del estado actual.

---

## Antipatterns del modelado

Vigilar estos errores típicos (catalogados en [docs/08-domain-modeling.md](../../spec-driven-development/docs/08-domain-modeling.md)):

- ❌ **Sobre-modelado** — todo concepto del problema como entity separada. Radar tiene **1 sola entity** y eso es correcto, no pobre — es el tamaño honesto del dominio.
- ❌ **Confundir entity con tabla de DB** — la tabla `noticias` (en español) es persistencia (C6). La entity `Noticia`/`NewsItem` es concepto del problema (C2). La traducción ocurre en `lib/db.ts`.
- ❌ **Domain events que son eventos técnicos** — `NoticiaUpserted` ✅, `DatabaseUpdated` ❌. `CronEjecutado` queda fuera (es C4 workflow, no C2 dominio).
- ❌ **Invariantes esparcidas en el código** en vez de protegidas en el aggregate root.
- ❌ **Bounded contexts implícitos** — N/A en radar (solo 1 contexto).
- ❌ **Promover toda configuración a VO** — `keywordMap` y `sourceDefaults` son **reglas del contexto** (R2), no VOs. Modelarlos como VOs formales sería over-engineering para este proyecto.

## Cuándo actualizar este archivo

| Cambio | Acción |
|---|---|
| Nueva entity / aggregate emerge en una spec | Agregar acá **antes** de implementarla. La spec referencia este doc. |
| Renombre de un término del dominio (ej. `Noticia` → otra cosa) | Actualizar acá + en `glossary.md` + propagar a código. `/audit-glossary` lo detecta si no se hace. |
| Nueva invariante descubierta | Agregar al aggregate root `Noticia`. Si es cross-aggregate, repensar — pero hoy solo hay 1 aggregate. |
| Cambio de stack / DB / framework (Supabase → otra cosa, Next.js → otra cosa) | **NADA** acá. Eso es C6 (`architecture.md` o `CLAUDE.md`). |
| Nuevo bounded context emerge (ej: si se agrega newsletter, búsqueda, multi-tenant) | Documentar en context map + crear sección nueva. Sospechar si el "contexto nuevo" es solo una feature de la `Vitrina`. |
| Aparece consumidor real de los domain events latentes | Materializar como eventos de aplicación (Capa 3+). El modelo de dominio acá no cambia. |

## Disciplina con SPIV

Cada `spec.md` que toque el dominio debe responder (5 preguntas DDD obligatorias):

1. ¿En qué bounded context vive esta feature? → para radar hoy: siempre `agregacion-de-noticias`.
2. ¿Qué aggregate(s) modifica? → para radar hoy: siempre `Noticia` (o ninguno, si la feature es solo UI).
3. ¿Qué invariantes del dominio toca? → I1, I2, I3 (más I4 si se cierra P1).
4. ¿Qué domain events emite? → de los 3 latentes, o agrega uno nuevo (justificar).
5. ¿Algún término nuevo? → si sí: agregar a `glossary.md` + acá si introduce concepto del modelo.

`/audit` verifica que las preguntas estén contestadas. `/audit-glossary --check` verifica que el código respete los términos.

---

*Las 7 capas (Capa 2 = este artefacto) → [../../spec-driven-development/docs/01-seven-layers.md](../../spec-driven-development/docs/01-seven-layers.md)*
*Capa 2 Dominio en detalle (conceptos, trampas, integración con SPIV) → [../../spec-driven-development/docs/08-domain-modeling.md](../../spec-driven-development/docs/08-domain-modeling.md)*
*Vocabulario derivado de este modelo → [glossary.md](glossary.md)*
*Componentes técnicos que implementan este modelo (Capa 3) → [architecture.md](architecture.md)*
