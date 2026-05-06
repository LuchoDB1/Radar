<!-- TEMPLATE: Runbook — copiar a docs/runbooks/[nombre-del-procedimiento].md y completar. -->

# Runbook — [Nombre del procedimiento]

> Procedimiento operativo para [acción concreta]. Apunta al "yo del futuro a las 3am" — claro, sin asumir contexto, ejecutable paso a paso.

- **Frecuencia esperada**: [diaria | semanal | mensual | bajo demanda | post-incidente]
- **Última revisión**: [YYYY-MM-DD]
- **Owner**: [persona o rol]
- **Tiempo estimado**: [N min]

## Cuándo correr este runbook

[Disparadores claros. Si dudás si aplica, documentá los criterios para que el yo-3am no tenga que pensar.]

- [Disparador 1: ej. alerta X dispara, error Y aparece, métrica Z cae bajo umbral]
- [Disparador 2]

## Pre-requisitos

- [ ] Acceso a [sistema / dashboard / credencial]
- [ ] [Herramienta CLI instalada]
- [ ] [Permisos necesarios verificados]

## Pasos

### Paso 1 — [Acción concreta]

```bash
# Comando exacto, con flags reales (no <placeholder>)
[comando]
```

**Output esperado**:
```
[Una o dos líneas que confirman que funcionó]
```

**Si falla**: [qué hacer — link a otro runbook / fallback / escalar a quién]

### Paso 2 — [Acción concreta]

[Repetir patrón.]

### Paso 3 — Verificación

[Cómo confirmar que el procedimiento dejó al sistema en buen estado. Métrica observable, comando de validación, dashboard a chequear.]

## Postcondición

[Estado del sistema después de correr este runbook. Qué cambió, qué quedó igual.]

## Si algo sale mal

| Síntoma | Causa probable | Acción |
|---------|---------------|--------|
| [error 1] | [hipótesis] | [siguiente paso o link a otro runbook] |
| [error 2] | [hipótesis] | [siguiente paso] |

**Escalación**: si los pasos arriba no resuelven, [a quién contactar / qué incident abrir].

## Referencias

- [ADR relacionado si aplica]
- [Architecture / workflow donde está el componente que toca]
- [Incident.md previo donde se usó este runbook]

## Historial

| Fecha | Cambio | Por qué |
|-------|--------|---------|
| YYYY-MM-DD | Creado | [evento que disparó] |
| YYYY-MM-DD | [revisión] | [qué cambió] |

---

> **Disciplina**: si corriste este runbook y un paso era confuso o estaba mal, **actualizalo en el momento**. Un runbook desactualizado es peor que no tener runbook — da falsa sensación de control.
