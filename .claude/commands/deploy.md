# Skill: /deploy

Desplegá el proyecto Radar a producción siguiendo estos pasos en orden:

## Pasos

1. **Verificar que no hay errores** — Corré `npm run lint` en `/Users/debernardiluciano/proyectos/radar`. Si hay errores, avisale al usuario y no sigas.

2. **Ver qué cambió** — Corré `git status` y `git diff --stat` para mostrarle al usuario un resumen de los archivos modificados.

3. **Confirmar con el usuario** — Preguntale un mensaje para el commit o usá uno descriptivo basado en los cambios detectados. Esperá su respuesta antes de continuar.

4. **Hacer el commit** — Corré:
   ```
   git add .
   git commit -m "[mensaje confirmado]"
   ```

5. **Subir a GitHub** — Corré `git push origin main`. Si falla, avisá el error.

6. **Confirmar el deploy** — Avisale al usuario que Vercel detectó el push y está redesplegando automáticamente. El nuevo deploy tarda ~1 minuto.

## Notas
- Nunca uses `--force` en el push
- Si el lint falla, corregí los errores antes de continuar
- El proyecto está en `/Users/debernardiluciano/proyectos/radar`
- El repo remoto es `https://github.com/LuchoDB1/radar`
