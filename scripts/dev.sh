#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo 'GYM BEER preview: http://localhost:3000/'
exec python3 -m http.server 3000 --bind 0.0.0.0
