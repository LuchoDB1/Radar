#!/bin/bash
# Hook: pre-commit-lint
# Intercepta cualquier comando Bash que contenga "git commit"
# y corre el linter antes de dejarlo pasar.

# Lee el input JSON que Claude Code manda por stdin
input=$(cat)

# Extrae el comando que Claude está por ejecutar
command=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

# Si el comando no es un git commit, dejamos pasar
if ! echo "$command" | grep -q "git commit"; then
  exit 0
fi

# Es un git commit — corremos el linter primero
echo "🔍 Hook: corriendo lint antes del commit..." >&2
cd /Users/debernardiluciano/proyectos/radar

npm run lint --silent 2>&1
lint_exit=$?

if [ $lint_exit -ne 0 ]; then
  # Bloqueamos el commit
  echo '{"decision":"block","reason":"El linter falló. Corregí los errores antes de commitear."}'
  exit 0
fi

echo "✅ Lint OK — dejando pasar el commit." >&2
# No imprimimos nada = dejamos pasar
exit 0
