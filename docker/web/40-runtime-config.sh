#!/bin/sh
# Writes /usr/share/nginx/html/config.js from environment variables at container
# start, so the same image can be deployed with different Firebase projects.
# Accepts VITE_* names (preferred) and legacy REACT_APP_* names.
set -eu

out=/usr/share/nginx/html/config.js

# JSON-escape backslashes and double quotes.
esc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

pick() {
    eval "v=\${VITE_$1:-}"
    [ -n "$v" ] || eval "v=\${REACT_APP_$1:-}"
    [ -n "$v" ] || eval "v=\${$1:-}"
    printf '%s' "$v"
}

{
    printf 'window.__APP_CONFIG__ = {'
    sep=''
    for key in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID FIREBASE_STORAGE_BUCKET \
               FIREBASE_MESSAGING_SENDER_ID FIREBASE_APP_ID FIREBASE_MEASUREMENT_ID IMGBB_API_KEY PLANNER_ENABLED API_BASE_URL; do
        val=$(pick "$key")
        if [ -n "$val" ]; then
            printf '%s"%s":"%s"' "$sep" "$key" "$(esc "$val")"
            sep=','
        fi
    done
    printf '};\n'
} > "$out"

echo "runtime-config: wrote $(grep -o '"[A-Z_]*":' "$out" | wc -l | tr -d ' ') keys to config.js"
