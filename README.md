# GYM BEER — site oficial (V1)

Site static, minimalist, SEO local pentru **GYM BEER, Chișinău**. 7 pagini, 36 de fotografii din arhiva primită, două locații și catalog cu prețuri de referință **din 2025**. Prețurile **din 2026 nu sunt confirmate**; informația de pe site explică actualizarea lor ca urmare a inflației.

## Pornește în GitHub Codespaces

Ultima versiune poate fi preluată și pornită astfel:

```bash
git pull --ff-only origin main && bash scripts/start-preview.sh
```

Fotografiile eliminate la cerere au fost scoase complet din galerie și din folderul de imagini.

Dacă fișierele sunt deja în GitHub, intră în repository, alege **Code → Codespaces → Create codespace on main**. Preview-ul pornește automat pe portul **3000**; deschide-l din tab-ul **PORTS**.

Dacă vrei să-l pornești manual:

```bash
bash scripts/start-preview.sh
```

Preview: `http://localhost:3000` (în Codespaces se deschide prin tab-ul **PORTS**). Fără `npm install`, build, cont extern sau chei API.

### Cum încarci pachetul de la ChatGPT într-un repository nou

1. Intră pe [github.com/new](https://github.com/new) și creează repo-ul `gym-beer-website` în contul tău, cu **Add README** activat.
2. În repo, apasă **Code → Codespaces → Create codespace on main**.
3. Descarcă pachetul `GYM_BEER_Codespaces_Ready.zip` din ChatGPT și trage ZIP-ul în Explorer-ul din Codespaces (în directorul rădăcină al repo-ului).
4. Rulează **o singură comandă** în terminal:

```bash
unzip -o GYM_BEER_Codespaces_Ready.zip -d . && bash scripts/publish.sh
```

Comanda dezarhivează, face commit, `git push` și pornește preview-ul. Fișierul ZIP este exclus din commit prin `.gitignore`. După primul push, dacă nu pornește automat preview-ul la deschiderea următoare, folosește `bash scripts/start-preview.sh`. Pentru configurare automată completă, rulează **Codespaces: Rebuild Container** după primul push.

## Teste

```bash
python3 scripts/check-site.py
```

## Harta site-ului

| Pagină | URL |
| --- | --- |
| Acasă | `/` |
| Băuturi | `/bauturi/` |
| Gustări | `/gustari/` |
| Galerie | `/galerie/` |
| Contact („Ne vedem aici”) | `/contact/` |
| Botanica | `/locatii/botanica/` |
| Buiucani | `/locatii/buiucani/` |

## Date de verificat înainte de publicare

- Prețurile afișate ca reper sunt din **2025**, nu sunt actualizate automat pentru 2026.
- Lista completă cu 32 de beri, 4 vinuri și 3 băuturi fără alcool încă necesită confirmarea produselor individuale.
- Verifică orarul și adresa exactă pentru Buiucani, precum și orarul pentru Botanica.
- Verifică numărul de telefon pentru ambele locații. Comenzile la domiciliu / plata online **nu sunt afirmate** fără confirmare.
- `sitemap.xml.example` este un șablon. După alegerea domeniului, completează sitemap.xml, URL-uri canonice, Open Graph și Google Search Console.

## Tehnologie

HTML, CSS, JS fără framework, imagini WebP la 760 / 1600 px. Optimizat pentru mobil și ușor de publicat pe un hosting static. Conținutul este indexabil fără JavaScript. Schimbă stilul în `assets/site.css` și textele direct în fișierele HTML.

## V4 — layout compact

- Logo-ul este limitat la 176 × 52 px pe desktop, iar CSS-ul este reîncărcat cu `?v=4` pentru a evita cache-ul vechi.
- Hero-ul are titlu și imagine mai compacte, butoanele sunt vizibile mai rapid fără scroll.
- Spațiere redusă păstrând design-ul minimalist și responsive.
- Au fost păstrate toate informațiile SEO și cele 7 pagini.
- Pentru preview în Codespaces: `git pull --ff-only origin main && bash scripts/start-preview.sh`.
