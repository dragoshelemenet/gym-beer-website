#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo 'Error: open this folder inside the new GitHub repository Codespace.' >&2
  exit 1
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  echo 'Error: no GitHub origin remote is configured.' >&2
  exit 1
fi
# Keep ZIP transfer files out of git; site + images + Codespaces config are committed.
git add -A
if git diff --cached --quiet; then
  echo 'No new changes to commit.'
else
  git commit -m 'Add GYM BEER website v1 with Codespaces configuration'
fi
git push origin HEAD
bash scripts/start-preview.sh
printf '
Success. In Codespaces open PORTS and click the browser icon for port 3000.
'
