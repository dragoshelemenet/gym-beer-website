#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if curl --silent --fail http://127.0.0.1:3000/ >/dev/null; then
  echo 'GYM BEER: preview already running at http://localhost:3000/'
  exit 0
fi
nohup python3 -m http.server 3000 --bind 0.0.0.0 > /tmp/gym-beer-preview.log 2>&1 < /dev/null &
echo "GYM BEER: preview starting on port 3000 (PID $!)"
