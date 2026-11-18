#!/usr/bin/env python3
"""Generează versiunea rusă (/ru/) din paginile românești.

Paginile RO sunt singura sursă. Textele se traduc din i18n/ru.json
(cheie = textul românesc, valoare = traducerea rusă).

Folosire:
  python3 scripts/build-ru.py          # adaugă textele noi în i18n/ru.json, apoi construiește /ru/
  python3 scripts/build-ru.py --check  # doar raportează textele netraduse (cod 1 dacă există)

Când modifici ceva pe RO: rulezi scriptul. Textele noi apar în i18n/ru.json cu valoare ""
și sunt listate; până le traduci, pe RU apare textul românesc.
Scriptul pune și comutatorul RO/RU în header pe toate paginile (RO și RU).
"""
from __future__ import annotations

import html
import json
import posixpath
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DICT = ROOT / "i18n" / "ru.json"
OUT = ROOT / "ru"

TRANSLATED_ATTRS = ("alt", "aria-label", "title", "placeholder", "data-caption")
META_TEXT = re.compile(r'<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"', re.I)
LANG_START, LANG_END = "<!--lang-->", "<!--/lang-->"


def ro_pages() -> list[Path]:
    return sorted(p for p in ROOT.rglob("index.html")
                  if ".git" not in p.parts and p.relative_to(ROOT).parts[0] != "ru")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def wants(s: str) -> bool:
    return bool(re.search(r"[A-Za-zĂÂÎȘȚăâîșț]", s))


# ---------- comutator RO/RU ----------
def page_dir(rel: Path) -> str:
    d = rel.parent.as_posix()
    return "" if d == "." else d + "/"


def lang_switch(rel: Path, lang: str) -> str:
    d = page_dir(rel)
    depth = d.count("/")
    if lang == "ro":
        ro, ru = "./" if d else "index.html", "../" * depth + "ru/" + d
    else:
        ro, ru = "../" * (depth + 1) + d, "./" if d else "index.html"
    def a(code, href, label):
        cur = ' aria-current="true"' if code == lang else ""
        return f'<a href="{href}" hreflang="{code}" lang="{code}"{cur} aria-label="{label}">{code.upper()}</a>'
    return (f'{LANG_START}<span class="lang-switch">{a("ro", ro, "Română")}'
            f'<span aria-hidden="true">/</span>{a("ru", ru, "Русский")}</span>{LANG_END}')


def put_switch(doc: str, rel: Path, lang: str) -> str:
    doc = re.sub(re.escape(LANG_START) + ".*?" + re.escape(LANG_END), "", doc, flags=re.S)
    sw = lang_switch(rel, lang)
    doc = doc.replace('<div class="header-end">', '<div class="header-end">' + sw, 1)
    doc = re.sub(r'(<nav class="mobile-nav"[^>]*>)', r"\1" + sw.replace('class="lang-switch"', 'class="lang-switch lang-switch-mobile"'), doc, count=1)
    return doc


# ---------- traducere ----------
class Translator:
    def __init__(self, table: dict[str, str]):
        self.table, self.seen, self.missing = table, [], []
        # Șabloane: o cheie cu {} acoperă toate textele de forma respectivă,
        # ex. "Deschide fotografie: {}" -> "Открыть фото: {}" (partea din {} se traduce separat).
        self.templates = [(k, re.compile("^" + re.escape(k).replace(r"\{\}", "(.+?)") + "$"))
                          for k in table if "{}" in k]

    def lookup(self, key: str) -> tuple[str, str]:
        """Returnează (cheia din dicționar, traducerea sau "")."""
        if key in self.table:
            return key, self.table[key]
        for tk, rx in self.templates:
            m = rx.match(key)
            if m and self.table.get(tk):
                inner = m.group(1)
                inner_tr = self.table.get(inner) or inner
                return tk, self.table[tk].replace("{}", inner_tr)
        return key, ""

    def tr(self, raw: str, escape_quotes: bool) -> str:
        key = norm(raw)
        if not key or not wants(key):
            return raw
        dict_key, val = self.lookup(key)
        if dict_key not in self.seen:
            self.seen.append(dict_key)
        if not val:
            if key not in self.missing:
                self.missing.append(key)
            return raw
        lead = raw[: len(raw) - len(raw.lstrip())]
        trail = raw[len(raw.rstrip()):]
        return lead + html.escape(val, quote=escape_quotes) + trail

    def text_nodes(self, doc: str) -> str:
        parts = re.split(r"(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->|<[^>]+>)", doc, flags=re.S | re.I)
        for i in range(0, len(parts), 2):
            parts[i] = self.tr(parts[i], False)
        for i in range(1, len(parts), 2):
            parts[i] = self.tag(parts[i])
        return "".join(parts)

    def tag(self, t: str) -> str:
        if t.startswith(("<script", "<style", "<!--", "</")):
            return t
        def attr(m):
            return f'{m.group(1)}="{self.tr(m.group(2), True)}"'
        t = re.sub(r'(?<=\s)(%s)="([^"]*)"' % "|".join(map(re.escape, TRANSLATED_ATTRS)), attr, t)
        if META_TEXT.match(t):
            t = re.sub(r'(?<=\s)(content)="([^"]*)"', attr, t)
        return t


# ---------- căi relative pentru /ru/ ----------
def fix_paths(doc: str, rel: Path) -> str:
    d = page_dir(rel)

    def one(url: str) -> str:
        if not url or url.startswith(("#", "http:", "https:", "//", "mailto:", "tel:", "data:", "javascript:")):
            return url
        path = re.split(r"[?#]", url, 1)[0]
        target = posixpath.normpath(posixpath.join(d, path)) if path else d
        is_page = path == "" or path.endswith("/") or path.endswith(".html") or "." not in posixpath.basename(target)
        return url if is_page else "../" + url

    def attr(m):
        name, val = m.group(1), m.group(2)
        if name == "srcset":
            val = ", ".join(" ".join([one(p.split()[0])] + p.split()[1:]) for p in val.split(",") if p.strip())
        else:
            val = one(val)
        return f'{name}="{val}"'

    doc = re.sub(r'(?<=\s)(href|src|srcset)="([^"]*)"', attr, doc)
    return doc


def localize_head(doc: str, rel: Path) -> str:
    doc = doc.replace('<html lang="ro">', '<html lang="ru">', 1)
    doc = doc.replace('content="ro_MD"', 'content="ru_MD"')
    return doc


def hreflang(doc: str, rel: Path, lang: str) -> str:
    doc = re.sub(r'<link rel="alternate" hreflang="[^"]*"[^>]*>', "", doc)
    d = page_dir(rel); depth = d.count("/")
    if lang == "ro":
        ro, ru = "./" if d else "index.html", "../" * depth + "ru/" + d
    else:
        ro, ru = "../" * (depth + 1) + d, "./" if d else "index.html"
    links = f'<link rel="alternate" hreflang="ro" href="{ro}"><link rel="alternate" hreflang="ru" href="{ru}">'
    return doc.replace("</head>", links + "</head>", 1)


def main() -> int:
    check = "--check" in sys.argv
    table: dict[str, str] = json.loads(DICT.read_text("utf-8")) if DICT.exists() else {}
    t = Translator(table)
    out: dict[Path, str] = {}
    for page in ro_pages():
        rel = page.relative_to(ROOT)
        src = page.read_text("utf-8")
        is_redirect = 'http-equiv="refresh"' in src
        if not is_redirect:
            new_ro = hreflang(put_switch(src, rel, "ro"), rel, "ro")
            if new_ro != src and not check:
                page.write_text(new_ro, "utf-8")
            src = new_ro
        doc = t.text_nodes(re.sub(re.escape(LANG_START) + ".*?" + re.escape(LANG_END), "", src, flags=re.S))
        doc = localize_head(doc, rel)
        if not is_redirect:
            doc = hreflang(put_switch(doc, rel, "ru"), rel, "ru")
        out[rel] = fix_paths(doc, rel)

    # dicționar: păstrează traducerile, adaugă cheile noi, marchează cele nefolosite
    merged = {k: table.get(k, "") for k in t.seen}
    unused = [k for k in table if k not in merged]
    if not check:
        DICT.parent.mkdir(exist_ok=True)
        DICT.write_text(json.dumps(merged, ensure_ascii=False, indent=1) + "\n", "utf-8")
        if OUT.exists():
            shutil.rmtree(OUT)
        for rel, doc in out.items():
            dest = OUT / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(doc, "utf-8")
        print(f"/ru/ generat: {len(out)} pagini, {len(merged)} texte.")
    if unused:
        print(f"{len(unused)} traduceri vechi nu mai sunt folosite (textul RO s-a schimbat) și au fost scoase.")
    if t.missing:
        print(f"{len(t.missing)} texte fără traducere (apar în română pe /ru/). Completează-le în i18n/ru.json:")
        for k in t.missing[:40]:
            print("  -", k[:90])
        return 1 if check else 0
    print("Toate textele au traducere.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
