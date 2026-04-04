# Skill: /report

Genera y abre el reporte diario del feed de noticias Radar.

## Pasos

1. **Verificar que el servidor está corriendo** — Corré `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/report`. Si devuelve algo distinto a `200`, avisale al usuario que tiene que correr `npm run dev` primero y no sigas.

2. **Abrir el reporte en el browser** — Corré:
   ```
   open http://localhost:3000/api/report
   ```

3. **Confirmar al usuario** — Avisale que el reporte se abrió en el browser con el resumen de noticias del día por categoría.

## Notas
- El reporte siempre es fresco (sin caché)
- Requiere que el servidor de Next.js esté corriendo en localhost:3000
- El endpoint vive en `app/api/report/route.ts`
