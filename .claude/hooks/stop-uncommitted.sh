#!/bin/bash
# Hook: stop-uncommitted
# Se ejecuta cuando Claude termina de responder.
# Si hay cambios sin commitear, imprime un recordatorio.

cd /Users/debernardiluciano/proyectos/radar

# Verifica si hay cambios staged, unstaged o untracked
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  CHANGED=$(git status --short | wc -l | tr -d ' ')
  echo "⚠️  Tenés $CHANGED archivo(s) con cambios sin commitear. Corré /deploy cuando estés listo."
fi

exit 0
