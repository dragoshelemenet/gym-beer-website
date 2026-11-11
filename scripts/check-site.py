#!/usr/bin/env python3
"""Validate internal file references and important page headings without dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse
root=Path(__file__).resolve().parent.parent
errors=[]
class SiteParser(HTMLParser):
    def __init__(self, page):
        super().__init__(); self.page=page; self.h1=0; self.title=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='h1': self.h1+=1
        if tag=='title': self.title+=1
        if tag not in ('a','img','script','link','source'): return
        for key in ('href','src','srcset'):
            if key not in attrs: continue
            links=[a.strip().split()[0] for a in attrs[key].split(',')] if key=='srcset' else [attrs[key]]
            for url in links:
                if not url or url.startswith(('#','//','mailto:','tel:','data:','javascript:')):continue
                parsed=urlparse(url)
                if parsed.scheme or parsed.netloc:continue
                path=unquote(parsed.path)
                target=root/path.lstrip('/') if path.startswith('/') else self.page.parent/path
                if not target.exists(): errors.append(f'{self.page.relative_to(root)}: missing {url}')
for page in root.rglob('*.html'):
    p=SiteParser(page);p.feed(page.read_text(encoding='utf-8'))
    if p.h1!=1:errors.append(f'{page.relative_to(root)}: {p.h1} H1 headings')
    if p.title!=1:errors.append(f'{page.relative_to(root)}: {p.title} title tags')
for image in (root/'assets/images').glob('*.webp'):
    if image.stat().st_size == 0:errors.append(f'empty image: {image.name}')
if errors:
    print('FAILED:');print('\n'.join(errors));raise SystemExit(1)
print('PASS: HTML pages, H1/title counts, local links and image files validated.')
