<!-- TEMPLATE: Incident / Postmortem — copiar a docs/incidents/YYYY-MM-DD-titulo-corto.md y completar. -->

# Incident — [Título descriptivo en presente]

- **Fecha del evento**: [YYYY-MM-DD HH:MM ART]
- **Detección**: [YYYY-MM-DD HH:MM ART] · [cómo se detectó: alerta / usuario / monitoreo / casualidad]
- **Resolución**: [YYYY-MM-DD HH:MM ART]
- **Severidad**: [S1 producción caída | S2 degradación | S3 bug acotado | S4 cosmético]
- **Detectado por**: [persona / alerta / sistema]
- **Sesión / spec relacionada**: [link si aplica]

## TL;DR

[Una sola oración. Qué falló, qué se resolvió.]

## Línea de tiempo

| Hora | Evento |
|------|--------|
| HH:MM | [Causa raíz disparada — el cambio / deploy / condición que originó] |
| HH:MM | [Síntoma observable empieza a aparecer] |
| HH:MM | Detección |
| HH:MM | Diagnóstico |
| HH:MM | Mitigación aplicada |
| HH:MM | Sistema restaurado |

## Qué pasó

[Descripción narrativa: qué se observó, qué se intentó, qué resolvió. 2-4 párrafos. Sin culpas — los sistemas fallan, las personas no.]

## Causa raíz

**Causa inmediata**: [el bug / config / cambio puntual]

**Causa estructural**: [por qué el sistema permitió que esto sucediera — esto es lo importante]

> Si no podés escribir la causa estructural, todavía no entendés el incidente. Pensar más antes de proponer fix.

## Trazado al principio central

> [Citar el principio central de MODEL.md]

[Cómo este incidente expone una violación o un gap respecto al principio. Si no se conecta, ¿es realmente nuestro problema o es algo cosmético?]

## Señal que faltaba

[¿Qué guardrail / test / monitor / invariante hubiera detectado esto antes de que llegue a producción / al usuario? Esta es la pregunta más importante del postmortem.]

- [ ] [Señal faltante 1 — ej: un test E2E para flujo X, una alerta sobre métrica Y]
- [ ] [Señal faltante 2]

## Cambio estructural propuesto

> Disciplina: si el postmortem no propone un cambio al sistema, no es postmortem — es solo un evento. Forzá este campo.

| Cambio | Archivo a tocar | Propietario | Plazo |
|--------|-----------------|-------------|-------|
| [Agregar test E2E que cubre X] | `e2e/X.spec.ts` | [persona] | [fecha] |
| [Subir threshold de alerta Y] | `monitoring/alerts.yaml` | [persona] | [fecha] |
| [Documentar workaround en runbook Z] | `docs/runbooks/Z.md` | [persona] | [fecha] |

## Lo que NO vamos a cambiar (y por qué)

[Decisiones de no actuar son tan importantes como las de actuar. Documentar para que el yo-futuro no las re-discuta.]

- [Item que NO vamos a cambiar] — [razón]

## Lecciones que aplican a otros proyectos / a la metodología

[Si el patrón es portable, capturarlo. Esto puede ser candidato a un bullet en `meta/trend-watch.md` del repo SDD o a una invariante nueva en MODEL.md.]

## Followup

- [ ] Agregar items de "Cambio estructural" al ROADMAP del proyecto
- [ ] Si el cambio es estructural a la metodología, abrir ADR en repo SDD
- [ ] Actualizar runbooks afectados

## Referencias

- [Link a logs / dashboards relevantes (si son durables)]
- [ADR previo relacionado]
- [Spec de la feature involucrada]

---

> **Recordatorio**: el valor del postmortem está en el cambio estructural, no en la narrativa. Si seis meses después este archivo no tiene fix mergeado, quedó incompleto.
