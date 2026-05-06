# ADR 0001 — Mantener ESLint flat config (no migrar a `.eslintrc.json` legacy)

- **Estado**: Aceptada
- **Fecha**: 2026-05-05
- **Decidores**: Owner
- **Consultados**: —

## Contexto

Durante la adopción de SDD en radar (`/adopt` ejecutado el 2026-05-05), se detectó un mismatch entre el template canónico de SDD y la configuración real de radar:

- El template `templates/guardrails/.eslintrc.json` del repo SDD asume **ESLint legacy config** (formato `.eslintrc.*`).
- Radar fue bootstrappeado con `create-next-app` reciente que usa **ESLint flat config** (formato `eslint.config.mjs`, ESLint 9+).

Ambos formatos son funcionalmente equivalentes para las reglas que importan en este proyecto, pero conviven mal: ESLint 9+ desabilita el formato legacy por default, y mantener ambos archivos genera ambigüedad sobre cuál tiene precedencia.

La pregunta es: ¿migrar radar a `.eslintrc.json` para alinear con el template, o mantener flat config y documentar la divergencia?

## Trazado al principio central

> *Radar agrega y categoriza noticias RSS curadas del mundo IA y las sirve como un feed unificado y filtrable, sin requerir curaduría manual y sin bajarse por rate limits de feeds upstream.*

La decisión no impacta el principio central directamente — es operacional. Pero **una de las reglas operativas heredadas del CLAUDE.md global es "Edit > Write"**, que aplica también a archivos de configuración: si la config flat ya funciona y tiene las reglas correctas (`eslint-config-next/typescript` strict), no hay razón de fuerza mayor para reescribirla.

## Opciones evaluadas

### Opción A: Migrar radar a `.eslintrc.json` (alinear con template SDD)

**Descripción**: borrar `eslint.config.mjs`, copiar `.eslintrc.json` del template SDD, ajustar para Next.js 16, downgrade ESLint si fuera necesario.

**Pros**:
- Alineación 1:1 con el template SDD canónico
- Próxima vez que se actualice el template, radar se beneficia automáticamente

**Contras**:
- ESLint 9 desaconseja activamente legacy config — estaríamos remando contra el upstream
- Riesgo de regresión: las reglas exactas que aplica `eslint-config-next/typescript` en flat config pueden no traducirse trivialmente a `.eslintrc.json`
- Trabajo no relacionado con el principio central del proyecto
- Crea deuda inversa: cuando ESLint 10 elimine legacy config, hay que volver a migrar

### Opción B: Mantener flat config, documentar como divergencia

**Descripción**: dejar `eslint.config.mjs` tal como está (`eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`), no copiar `.eslintrc.json` del template, agregar sección "Divergencias" en `CLAUDE.md` apuntando a este ADR.

**Pros**:
- Cero trabajo
- Alineado con la dirección upstream de ESLint
- `make verify` puede correr `npm run lint` que ya funciona con flat config — los hooks de pre-commit se ajustan a llamar `npx eslint .` (que detecta flat config automáticamente)

**Contras**:
- Divergencia respecto al template canónico — futuros cambios al template no aplican directo
- `/audit --templates` del repo SDD valida el template `.eslintrc.json`, no la flat config — si en el futuro se quiere validar la flat config en sandbox, hay que extender ese audit

### Opción C: Actualizar el template SDD a flat config + alinear radar a la nueva versión

**Descripción**: el template SDD se actualiza a `eslint.config.mjs`. Radar ya cumple. Otros proyectos (portfolio-os, pircas, trading-bot) eventualmente migran cuando se adopten.

**Pros**:
- Sólo una versión "canónica" en el ecosistema
- ESLint 9+ es el futuro

**Contras**:
- Cambio al repo SDD que afecta a otros proyectos no migrados todavía
- Requiere coordinación entre la adopción de radar y el cambio en el repo SDD — esta sesión no debería bloquearse en eso
- Trabajo que escapa al scope de "adoptar SDD en radar"

## Decisión

**Elegimos**: Opción B — mantener flat config, documentar como divergencia.

**Por qué**: cero costo, alineación con upstream, y el problema canónico (template SDD asume legacy) se resuelve mejor en una sesión dedicada al repo SDD (Opción C diferida). La adopción de radar no debe arrastrar deuda al repo SDD ni al revés.

## Consecuencias

### Positivas

- Adopción de radar termina en tiempo (~2h) sin desviarse
- Radar queda alineado con upstream ESLint
- La divergencia queda explicitada en CLAUDE.md sección "Divergencias respecto a SDD canónico"

### Negativas (asumidas conscientemente)

- Cuando el template SDD se modifique (ej: agregar un plugin de seguridad), radar tiene que aplicar el cambio manualmente — no hereda automáticamente
- `/audit --templates` no valida la flat config de radar contra el sandbox SDD

### A mitigar

- **Riesgo: drift entre template SDD y radar** → cuando se toque el template SDD, agregar item al ROADMAP de radar para revisar si aplica
- **Riesgo: nuevo ADR queda huérfano si no se cita** → este ADR se cita desde `CLAUDE.md` (sección Divergencias) y `docs/glossary.md` (entrada "flat config")

## Implementación

- [x] Mantener `eslint.config.mjs` sin tocar
- [x] NO copiar `.eslintrc.json` del template SDD
- [x] Sección "Divergencias respecto a SDD canónico" en `CLAUDE.md` apunta a este ADR
- [x] Glosario incluye entrada "flat config" referenciando este ADR
- [ ] Agregar item al ROADMAP de radar: "Revisar si conviene migrar el template SDD a flat config (Opción C diferida) — esperar a que pircas/trading-bot también se adopten para decidir con más data"

## Verificación

- **Cuándo revisar**: cuando ESLint 10 sea estable o cuando el template SDD se actualice por otra razón (lo que ocurra primero)
- **Métrica de éxito**: `make verify` en radar pasa sin errores de ESLint; `npm run lint` también pasa
- **Métrica de fracaso**: si futuros cambios al template SDD requieren más de 1h de re-traducción manual a flat config, evaluar Opción C

## Referencias

- [ESLint 9 release notes](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/) — flat config como default
- [next/eslint package docs](https://nextjs.org/docs/app/api-reference/config/eslint)
- Template SDD: `~/proyectos/spec-driven-development/templates/guardrails/.eslintrc.json`

## Citado por

- `CLAUDE.md` sección "Divergencias respecto a SDD canónico"
- `docs/glossary.md` entrada "flat config"
