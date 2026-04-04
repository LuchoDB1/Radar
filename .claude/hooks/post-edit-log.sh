#!/bin/bash
# Hook: post-edit-log
# Se ejecuta después de cada uso de la tool Edit.
# Loguea qué archivo fue modificado, cuándo, y en qué sesión.

input=$(cat)

# Extrae el path del archivo editado
file_path=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Solo nos interesan archivos .ts y .tsx
if ! echo "$file_path" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

LOG_FILE="/Users/debernardiluciano/proyectos/radar/.claude/edit-log.txt"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

echo "$TIMESTAMP | session=$SESSION_ID | $file_path" >> "$LOG_FILE"

exit 0
