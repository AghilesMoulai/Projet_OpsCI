#!/usr/bin/env bash

dotenv_get() {
  local key="$1"
  local file="${2:-.env}"

  awk -v key="$key" '
    BEGIN {
      pattern = "^[[:space:]]*" key "[[:space:]]*="
    }
    $0 ~ pattern {
      line = $0
      sub(pattern, "", line)
      sub(/\r$/, "", line)
      print line
      found = 1
      exit
    }
    END {
      if (!found) {
        exit 1
      }
    }
  ' "$file"
}

require_dotenv_value() {
  local key="$1"
  local file="${2:-.env}"
  local value

  if ! value="$(dotenv_get "$key" "$file")"; then
    echo "Variable $key manquante dans $file." >&2
    exit 1
  fi

  printf '%s\n' "$value"
}
