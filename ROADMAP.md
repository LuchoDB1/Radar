# ROADMAP — Radar AI News Feed
> Última actualización: 2026-04-23

## Completado ✅

### Infraestructura
- [x] Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui
- [x] Deploy en Vercel
- [x] Supabase como base de datos de noticias

### Fuentes RSS
- [x] The Verge AI
- [x] Ars Technica AI
- [x] VentureBeat AI
- [x] DeepMind Blog
- [x] OpenAI Blog
- [x] Hugging Face Blog
- [x] MIT Tech Review

### Features
- [x] Parseo RSS server-side con `revalidate = 3600`
- [x] Categorización por keywords: Modelos, Empresas, Research, Tools, Regulación
- [x] Grid filtrable por categoría
- [x] Vercel Cron Job para poblar Supabase desde RSS
- [x] Leer noticias desde Supabase (no RSS directo en runtime)
- [x] Indicador "Actualizado" con timestamp en header
- [x] Fix legacy anon key para cliente Supabase

---

## Pendiente

### 🔴 Alta prioridad
- [ ] **Deduplicación** — evitar que el cron inserte noticias repetidas (mismo URL)
- [ ] **Error handling feeds** — algunos feeds bajan intermitentemente (monitor commits lo registra), agregar retry automático

### 🟠 Media prioridad
- [ ] **Resumen IA** — generar un resumen de 2-3 líneas por noticia con Claude Haiku
- [ ] **Más fuentes** — Anthropic Blog, Google DeepMind Research, a16z
- [ ] **Búsqueda** — input de búsqueda por keywords en las noticias
- [ ] **Paginación** — actualmente muestra N noticias sin paginado

### 🟢 Baja prioridad / Ideas
- [ ] **Newsletter** — envío semanal de las top noticias por email (Resend)
- [ ] **Feed propio** — RSS output de Radar para que otros lo consuman
- [ ] **Auth** — versión privada / dashboard personalizado por usuario
- [ ] **Trending** — destacar noticias más leídas o más recientes por categoría

---

## Notas técnicas

- Supabase client usa legacy anon key (no JWT) — no cambiar
- Monitor commits (`monitor: feed down detected`) son automáticos del cron de Vercel
- `revalidate = 3600` en routes de API — no bajar, evita rate limits de RSS
