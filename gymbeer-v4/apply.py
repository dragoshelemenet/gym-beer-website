#!/usr/bin/env python3
"""GYM BEER V4: compact header, homepage, and spacing without changing products or SEO copy.
Safe to apply to V1, V2, V3, or reapply V4; never accesses the network.
"""
from pathlib import Path
import re, json, shutil

pack = Path(__file__).resolve().parent
root = pack.parent
required=['index.html','assets/site.css','assets/image-index.json','galerie/index.html','scripts/check-site.py']
for x in required:
    if not (root/x).is_file(): raise SystemExit(f'ERROR: Missing {x}; use the root of the GYM BEER site.')

# Make sure the official identity is installed for sites that skipped V3.
brand = root/'assets/brand'
brand.mkdir(exist_ok=True, parents=True)
for f in (pack/'assets/brand').iterdir():
    if f.is_file(): shutil.copy2(f, brand/f.name)

# Keep the earlier requested removal of four photos even for an older V1 repo.
removed=('shop-interior-vertical','bottled-beer-display','beer-taps-detail','draft-selection-wall')
for file,renames in {
    'index.html':{'beer-taps-detail':'beer-assortment-wall','draft-selection-wall':'holz-taps-snack'},
    'bauturi/index.html':{'beer-taps-detail':'beer-assortment-wall'},
    'locatii/botanica/index.html':{'shop-interior-vertical':'shop-interior-wide'},
}.items():
    p=root/file; s=p.read_text(encoding='utf-8')
    for old,new in renames.items(): s=s.replace(old,new)
    p.write_text(s,encoding='utf-8')

p=root/'galerie/index.html'; s=p.read_text(encoding='utf-8')
for slug in removed:
    pattern=r'<a href="\.\./assets/images/'+re.escape(slug)+r'-1600\.webp" class="gallery-tile".*?</a>'
    s=re.sub(pattern,'',s,count=1)
s=s.replace('Toate cele 40 de fotografii din arhiva primită.','36 de fotografii selectate din arhiva GYM BEER.')
s=s.replace('<h2>Magazinele</h2><span>8 fotografii</span>','<h2>Magazinele</h2><span>7 fotografii</span>')
s=s.replace('<h2>Bere & băuturi</h2><span>16 fotografii</span>','<h2>Bere & băuturi</h2><span>13 fotografii</span>')
if s.count('class="gallery-tile"')!=36: raise SystemExit('ERROR: Gallery expected 36 photos; please inspect your changes.')
p.write_text(s,encoding='utf-8')

p=root/'assets/image-index.json'; a=json.loads(p.read_text(encoding='utf-8'))
a=[x for x in a if x.get('slug') not in removed]
if len(a)!=36: raise SystemExit(f'ERROR: Photo index expected 36, got {len(a)}.')
p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for slug in removed:
    for size in ('760','1600'):
        (root/'assets/images'/f'{slug}-{size}.webp').unlink(missing_ok=True)

# CSS: install official logo rules if the repo still contains the V1 text wordmark.
p=root/'assets/site.css'; css=p.read_text(encoding='utf-8')
brand_css='''
/* Official GYM BEER identity — provided artwork */
.site-header .brand.brand-custom,.site-footer .brand.brand-custom{display:inline-flex;align-items:center;flex:0 0 auto;line-height:0;letter-spacing:normal}
.brand-custom .brand-image{display:block;width:176px;height:52px;max-width:100%;object-fit:contain;object-position:left center}
.site-footer .brand-custom{background:#f7f6f2;padding:9px 12px;border-radius:5px;width:max-content}
.site-footer .brand-custom .brand-image{width:190px;max-height:64px}
'''
if '/* Official GYM BEER identity' not in css: css=css.rstrip()+'\n'+brand_css
css=css.split('/* V4 — compact',1)[0].rstrip()+'\n'+(pack/'compact.css').read_text(encoding='utf-8')
p.write_text(css,encoding='utf-8')

h_re=re.compile(r'<a class="brand" href="([^"]+)" aria-label="GYM BEER — pagina principală"><span class="brand-mark" aria-hidden="true">✳</span><span>GYM<span class="brand-light">BEER</span></span></a>')
f_re=re.compile(r'<a class="brand brand-footer" href="([^"]+)"><span class="brand-mark" aria-hidden="true">✳</span><span>GYM<span class="brand-light">BEER</span></span></a>')
htmls=[root/'index.html',*root.glob('*/index.html'),*root.glob('locatii/*/index.html')]
if len(htmls)!=7:raise SystemExit(f'ERROR: Expected seven pages, got {len(htmls)}.')
for p in htmls:
    s=p.read_text(encoding='utf-8')
    pre='../'*(len(p.relative_to(root).parts)-1)
    if 'class="brand brand-custom"' not in s:
        s,n=h_re.subn(lambda m:'<a class="brand brand-custom" href="'+m.group(1)+'" aria-label="GYM BEER — pagina principală"><img class="brand-image" src="'+pre+'assets/brand/gym-beer-horizontal.webp" width="176" height="52" alt="GYM BEER — Bere Vie" decoding="async"></a>',s,count=1)
        if n!=1:raise SystemExit('ERROR: Could not add header logo to '+str(p))
    if 'class="brand brand-custom brand-footer"' not in s:
        s,n=f_re.subn(lambda m:'<a class="brand brand-custom brand-footer" href="'+m.group(1)+'" aria-label="GYM BEER — pagina principală"><img class="brand-image" src="'+pre+'assets/brand/gym-beer-horizontal.webp" width="190" height="56" alt="GYM BEER — Bere Vie" loading="lazy" decoding="async"></a>',s,count=1)
        if n!=1:raise SystemExit('ERROR: Could not add footer logo to '+str(p))
    # Force intrinsic dimensions so old cached styles cannot enlarge the header image.
    s,n=re.subn(r'(<a class="brand brand-custom"[^>]*>\s*<img class="brand-image"[^>]*?)width="\d+" height="\d+"(?: style="[^"]*")?',r'\g<1>width="176" height="52" style="width:176px;height:52px;max-width:100%;object-fit:contain"',s,count=1)
    if n!=1:raise SystemExit('ERROR: Could not constrain header image: '+str(p))
    s=re.sub(r'<link rel="icon" type="image/svg\+xml" href="[^"]*favicon\.svg">','<link rel="icon" href="'+pre+'assets/brand/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="'+pre+'assets/brand/apple-touch-icon.png">',s)
    if 'assets/brand/favicon.ico' not in s:raise SystemExit('ERROR: Favicon missing '+str(p))
    # CSS versioning is important: browsers may still cache V1 styles after V3 logo loads.
    s=re.sub(r'(href=")((?:\.\./)*assets/site\.css)(?:\?v=[^"]+)?(")',r'\1\2?v=4\3',s)
    for slug in removed:
        if slug in s:raise SystemExit('ERROR: Photo remains in '+str(p)+': '+slug)
    p.write_text(s,encoding='utf-8')
(root/'favicon.svg').unlink(missing_ok=True)

p=root/'README.md';s=p.read_text(encoding='utf-8')
s=s.replace('7 pagini, imagini reale din arhiva primită','7 pagini, 36 de fotografii din arhiva primită')
if '## V4 — layout compact' not in s:
    s+='''\n## V4 — layout compact\n\n- Logo-ul este limitat la 176 × 52 px pe desktop, iar CSS-ul este reîncărcat cu `?v=4` pentru a evita cache-ul vechi.\n- Hero-ul are titlu și imagine mai compacte, butoanele sunt vizibile mai rapid fără scroll.\n- Spațiere redusă păstrând design-ul minimalist și responsive.\n- Au fost păstrate toate informațiile SEO și cele 7 pagini.\n- Pentru preview în Codespaces: `git pull --ff-only origin main && bash scripts/start-preview.sh`.\n'''
p.write_text(s,encoding='utf-8')
print('PASS: V4 applied. Header logo contained; responsive layout compact; 36 approved photographs.')
