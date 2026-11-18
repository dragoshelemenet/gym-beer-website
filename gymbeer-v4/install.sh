#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ ! -f index.html || ! -f assets/site.css || ! -f scripts/check-site.py ]]; then
  echo 'ERROR: Run this installer from the GYM BEER website root.' >&2; exit 1
fi
if [[ "${GYM_BEER_DRY_RUN:-0}" != 1 ]]; then
  git rev-parse --show-toplevel >/dev/null 2>&1 || { echo 'ERROR: Not a Git repository.' >&2; exit 1; }
  if [[ "$(git branch --show-current)" != main ]]; then echo 'ERROR: Switch to main first.' >&2;exit 1;fi
  if ! git diff --cached --quiet; then echo 'ERROR: Staged changes exist; commit them first.' >&2;exit 1;fi
  if [[ -n "$(git diff --name-only -- index.html bauturi/index.html gustari/index.html galerie/index.html contact/index.html locatii/botanica/index.html locatii/buiucani/index.html assets/site.css assets/image-index.json README.md)" ]]; then
    echo 'ERROR: Local edits exist in site pages; commit or stash them before updating.' >&2; exit 1
  fi
fi
python3 gymbeer-v4/apply.py
python3 scripts/check-site.py
if [[ "${GYM_BEER_DRY_RUN:-0}" == 1 ]]; then echo 'PASS: Dry-run complete, no Git changes published.'; exit 0;fi
# The original bundled ZIP can still contain outdated images; remove if tracked.
if git ls-files --error-unmatch GYM_BEER_Codespaces_Ready.zip >/dev/null 2>&1; then
  rm -f GYM_BEER_Codespaces_Ready.zip
  git add -u -- GYM_BEER_Codespaces_Ready.zip
fi
git add -- assets/brand assets/site.css assets/image-index.json index.html bauturi/index.html gustari/index.html galerie/index.html contact/index.html locatii/botanica/index.html locatii/buiucani/index.html README.md
git add -u -- assets/images
if git ls-files --error-unmatch favicon.svg >/dev/null 2>&1; then git add -u -- favicon.svg;fi
if git diff --cached --quiet; then echo 'V4 already installed — no new changes.'; else
  git commit -m 'Make GYM BEER header logo fit and compact desktop and mobile layouts'
  git push origin HEAD:main
fi
echo 'DONE: V4 live in repo. Hard refresh the preview on port 3000.'
