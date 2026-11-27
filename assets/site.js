'use strict';
/* Etichete în limba paginii (RO sau RU). */
const T = document.documentElement.lang === 'ru'
  ? { open: 'Открыть меню', close: 'Закрыть меню', photo: 'Фото', photoAlt: 'Фото GYM BEER', closePhoto: 'Закрыть фото' }
  : { open: 'Deschide meniul', close: 'Închide meniul', photo: 'Fotografie', photoAlt: 'Fotografie GYM BEER', closePhoto: 'Închide fotografia' };
(() => {
  const menu = document.querySelector('.menu-trigger');
  const mobile = document.querySelector('#mobile-menu');
  if (menu && mobile) {
    const close = () => {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', T.open);
      mobile.hidden = true;
      document.body.classList.remove('menu-open');
    };
    menu.addEventListener('click', () => {
      if (menu.getAttribute('aria-expanded') === 'true') { close(); return; }
      menu.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-label', T.close);
      mobile.hidden = false;
      document.body.classList.add('menu-open');
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
    document.addEventListener('click', e => {if(!menu.contains(e.target) && !mobile.contains(e.target)) close();});
    window.matchMedia('(min-width: 761px)').addEventListener('change', e => {if(e.matches) close();});
  }
})();

/* Lightbox: produse din meniu, gustări și galerie se deschid în pagină. */
(() => {
  const box = document.createElement('div');
  box.className = 'lightbox'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T.photo);
  box.innerHTML = '<div class="lightbox-frame"><div class="lightbox-img" role="img"></div><div class="lightbox-shield"></div>' +
    '<p class="lightbox-cap"></p><button class="lightbox-close" type="button" aria-label="' + T.closePhoto + '">×</button></div>';
  document.body.appendChild(box);
  const img = box.querySelector('.lightbox-img'), cap = box.querySelector('.lightbox-cap');
  let last = null;
  const open = (src, text) => {
    last = document.activeElement;
    img.style.backgroundImage = `url("${src}")`;
    img.setAttribute('aria-label', text || T.photoAlt);
    cap.textContent = text || '';
    box.hidden = false; document.body.classList.add('menu-open');
    box.querySelector('.lightbox-close').focus();
  };
  const close = () => { box.hidden = true; img.style.backgroundImage = ''; document.body.classList.remove('menu-open'); if (last) last.focus(); };
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.lightbox-close')) close(); });
  document.addEventListener('keydown', e => {
    if (!box.hidden && e.key === 'Escape') close();
    const t = e.target.closest && e.target.closest('[data-photo][role=button]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(t.dataset.photo, t.dataset.caption); }
  });
  document.addEventListener('click', e => {
    const tile = e.target.closest('.gallery-tile');
    if (tile) { e.preventDefault(); open(tile.getAttribute('href'), tile.querySelector('span')?.textContent); return; }
    const directLink = e.target.closest('a[href]');
    if (directLink) { return; }
    const priceBtn = e.target.closest('.price-info-btn');
    if (priceBtn) {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = priceBtn.classList.contains('is-open');
      document.querySelectorAll('.price-info-btn.is-open').forEach(b => b.classList.remove('is-open'));
      if (!wasOpen) priceBtn.classList.add('is-open');
      return;
    }
    document.querySelectorAll('.price-info-btn.is-open').forEach(b => b.classList.remove('is-open'));
    const p = e.target.closest('[data-photo], .mc-item');
    if (p) {
      const prodLink = p.querySelector('a[href]');
      if (prodLink && !e.target.closest('.mc-chip')) {
        window.location.href = prodLink.getAttribute('href');
        return;
      }
      if (p.dataset.photo) {
        e.preventDefault();
        open(p.dataset.photo, p.dataset.caption);
      }
    }
  });
})();

/* Protecție de bază pentru fotografii: fără click-dreapta, tragere sau salvare prin apăsare lungă. */
(() => {
  const isPhoto = el => el && el.closest && el.closest('img, .gallery-tile, .lightbox, .snack-photo, .stamp, .feature-photo, .hero-collage, .editorial-photo, .subhero-photo, .gallery-preview, [data-photo]');
  document.addEventListener('contextmenu', e => { if (isPhoto(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (isPhoto(e.target)) e.preventDefault(); });
})();

/* Carte meniu: buton de printare. */
document.querySelector('.mc-print')?.addEventListener('click', () => window.print());

/* Meniu: filtru Tot / Doar băuturi / Doar gustări + căutare live fără diacritice. */
(() => {
  const card = document.querySelector('.menu-card');
  const tabs = document.querySelectorAll('.mc-filter [data-show]');
  if (!card || !tabs.length) return;

  const searchInput = document.getElementById('mc-search');
  const clearBtn = document.querySelector('.mc-search-clear');
  const countBadge = document.querySelector('.mc-search-count');
  const emptyBox = document.querySelector('.mc-empty');
  const emptyReset = document.querySelector('.mc-empty-reset');
  const parts = Array.from(card.querySelectorAll('.mc-part'));
  const sections = Array.from(card.querySelectorAll('.mc-section'));
  const isRu = document.documentElement.lang === 'ru';

  const norm = s => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е');

  // Cache normalized text + original counts once
  sections.forEach(sec => {
    const countEl = sec.querySelector('.mc-count');
    if (countEl) countEl.dataset.orig = countEl.textContent;
    const h2 = sec.querySelector('summary h2');
    sec.dataset.normHead = norm(h2 ? h2.textContent : '');
    sec.querySelectorAll('.mc-item').forEach(li => {
      li.dataset.normText = norm(li.textContent);
    });
  });

  const applySearch = () => {
    if (!searchInput) return;
    const raw = searchInput.value.trim();
    const q = norm(raw);
    const activeTab = card.dataset.show || 'tot';

    card.classList.toggle('is-searching', !!q);
    if (clearBtn) clearBtn.hidden = !raw;

    let totalMatches = 0;

    parts.forEach(part => {
      const partName = part.dataset.part;
      const tabAllows = activeTab === 'tot' || activeTab === partName;
      let partVisible = 0;

      part.querySelectorAll('.mc-section').forEach(sec => {
        const headMatch = q && sec.dataset.normHead.indexOf(q) !== -1;
        let secMatches = 0;
        sec.querySelectorAll('.mc-item').forEach(li => {
          const hit = !q || headMatch || li.dataset.normText.indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) secMatches++;
        });

        const countEl = sec.querySelector('.mc-count');
        if (countEl) countEl.textContent = q ? String(secMatches) : (countEl.dataset.orig || String(secMatches));

        sec.hidden = !!q && secMatches === 0;
        if (q && secMatches > 0) sec.open = true;
        if (tabAllows) partVisible += secMatches;
      });

      part.hidden = !!q && partVisible === 0;
      if (tabAllows) totalMatches += partVisible;
    });

    if (countBadge) {
      countBadge.hidden = !q;
      if (q) countBadge.textContent = isRu ? `${totalMatches}` : `${totalMatches}`;
    }
    if (emptyBox) {
      emptyBox.hidden = !q || totalMatches > 0;
    }
    card.querySelectorAll('.mc-jump a').forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      const tabHidden = activeTab !== 'tot' && sec && !sec.closest(`[data-part="${activeTab}"]`);
      a.hidden = !!tabHidden || (!!q && !!sec && sec.hidden);
    });
  };

  const set = v => {
    card.dataset.show = v;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.show === v)));
    card.querySelectorAll('.mc-jump a').forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      a.hidden = v !== 'tot' && sec && !sec.closest(`[data-part="${v}"]`);
    });
    applySearch();
  };

  tabs.forEach(t => t.addEventListener('click', () => {
    set(t.dataset.show);
    history.replaceState(null, '', t.dataset.show === 'tot' ? location.pathname : '#' + t.dataset.show);
  }));

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        applySearch();
      }
    });
  }
  const resetSearch = () => {
    if (!searchInput) return;
    searchInput.value = '';
    applySearch();
    searchInput.focus();
  };
  clearBtn?.addEventListener('click', resetSearch);
  emptyReset?.addEventListener('click', () => {
    set('tot');
    resetSearch();
  });

  const h = location.hash.slice(1);
  if (h === "bauturi" || h === "gustari") { set(h); requestAnimationFrame(() => card.scrollIntoView({ block: "start" })); }

  /* Salt la categorie (.mc-jump): evidențiază clar secțiunea țintă + pastila activă. */
  const jumpLinks = Array.from(card.querySelectorAll('.mc-jump a[href^="#"]'));
  let hiTimer = 0;
  const highlightSection = (sec, link) => {
    if (!sec) return;
    const part = sec.closest('.mc-part');
    if (part && card.dataset.show && card.dataset.show !== 'tot' && card.dataset.show !== part.dataset.part) {
      set('tot');
    }
    if (searchInput && searchInput.value.trim()) {
      searchInput.value = '';
      applySearch();
    }
    sec.open = true;
    jumpLinks.forEach(a => a.classList.toggle('is-active', a === link));
    sections.forEach(s => s.classList.remove('is-highlighted'));
    void sec.offsetWidth;
    sec.classList.add('is-highlighted');
    clearTimeout(hiTimer);
    hiTimer = setTimeout(() => {
      sec.classList.remove('is-highlighted');
    }, 3200);
  };

  jumpLinks.forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    highlightSection(target, a);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));

  if (h.startsWith('cat-')) {
    const initSec = document.getElementById(h);
    const initLink = jumpLinks.find(a => a.getAttribute('href') === '#' + h);
    if (initSec) requestAnimationFrame(() => highlightSection(initSec, initLink));
  }
})();

/* Galerie: deschisă cu #magazine / #bere / #gustari, sare la secțiunea respectivă după încărcare. */
(() => {
  const t = location.hash && document.querySelector('.gallery-category' + location.hash);
  if (!t) return;
  const go = () => t.scrollIntoView({ block: 'start', behavior: 'instant' });
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
})();

/* Paralax pe fotografia arcuită: se mișcă la scroll și urmărește mouse-ul. */
(() => {
  const img = document.querySelector('.editorial-photo .arch-img img');
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const band = img.closest('.editorial-band') || img.parentElement;
  let sy = 0, mx = 0, my = 0, raf = 0;
  const draw = () => { raf = 0; img.style.transform = `scale(1.14) translate3d(${mx}px, ${sy + my}px, 0)`; };
  const queue = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const onScroll = () => {
    const r = band.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
    sy = Math.max(-1, Math.min(1, p)) * 28; queue();
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    band.addEventListener('mousemove', e => {
      const r = band.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * -26;
      my = ((e.clientY - r.top) / r.height - .5) * -18; queue();
    });
    band.addEventListener('mouseleave', () => { mx = my = 0; queue(); });
  }
})();

/* Comutatorul RO/RU păstrează secțiunea deschisă (#bauturi, #gustari, #bere...). */
document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
  if (location.hash) a.href = a.href.split('#')[0] + location.hash;
}));


/* ============================================================================
 * WSOD COOKIE CONSENT (LEGEA 133/2011 RM & GDPR) + GOOGLE CONSENT MODE V2 + META PIXEL
 * Implicit (până la „Acceptă”): 0 cookies de marketing, ad_storage = denied.
 * ============================================================================ */
(() => {
  const CONSENT_KEY = 'gymbeer_cookie_consent_v2';
  const isRu = document.documentElement.lang?.toLowerCase().startsWith('ru');
  const CFG = Object.assign({ metaPixelId: '', ga4Id: '', googleAdsId: '' }, window.WSOD_PIXEL_CONFIG || {});
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  window.gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500
  });
  function clearMarketingCookies() {
    ['_fbp', '_fbc', '_ga', '_gid', '_gat', '_gcl_au', '_ttp'].forEach(name => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax`;
    });
  }
  let pixelsBooted = false;
  function bootConsentedPixels() {
    if (pixelsBooted) return;
    pixelsBooted = true;
    window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    const gId = CFG.ga4Id || CFG.googleAdsId;
    if (gId) {
      const s = document.createElement('script'); s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gId)}`;
      document.head.appendChild(s);
      window.gtag('js', new Date());
      if (CFG.ga4Id) window.gtag('config', CFG.ga4Id, { anonymize_ip: true });
      if (CFG.googleAdsId) window.gtag('config', CFG.googleAdsId);
    }
    if (CFG.metaPixelId) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('consent', 'grant');
      window.fbq('init', CFG.metaPixelId);
      window.fbq('track', 'PageView');
    }
  }
  document.addEventListener('click', e => {
    try { if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return; } catch { return; }
    const a = e.target.closest && e.target.closest('a'); if (!a) return;
    const href = a.getAttribute('href') || '';
    const eid = 'gb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    if (href.startsWith('tel:')) {
      window.gtag?.('event', 'contact_phone', { event_id: eid, page_path: location.pathname });
      window.fbq?.('track', 'Contact', { channel: 'phone', page_path: location.pathname }, { eventID: eid });
    } else if (href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) {
      window.gtag?.('event', 'find_location', { event_id: eid, page_path: location.pathname });
      window.fbq?.('track', 'FindLocation', { page_path: location.pathname }, { eventID: eid });
    } else if (href.includes('instagram.com') || href.includes('wa.me')) {
      window.gtag?.('event', 'contact_social', { event_id: eid, page_path: location.pathname });
      window.fbq?.('track', 'Lead', { channel: 'social', page_path: location.pathname }, { eventID: eid });
    }
  }, { passive: true });
  function openPolicyModal() {
    document.getElementById('gb-cookie-policy-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'gb-cookie-policy-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(20,24,20,0.68);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif';
    m.innerHTML = isRu ? `
      <div style="max-width:620px;width:100%;max-height:86vh;overflow-y:auto;background:#fbf8f0;color:#1f2a22;border:2px solid #1f2a22;border-radius:12px;padding:22px 24px;box-shadow:6px 6px 0 #d2a557">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px">
          <h2 style="margin:0;font-size:19px">Политика конфиденциальности и Cookies (Закон РМ № 133/2011)</h2>
          <button type="button" data-close="1" style="border:1.5px solid #1f2a22;background:#efe2c6;border-radius:6px;padding:4px 10px;font-weight:800;cursor:pointer">✕</button>
        </div>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>1. Общие сведения:</strong> Сайт <strong>gymbeermd.site</strong> (магазины GYM BEER, мун. Кишинёв, ул. Куза Водэ 1/4 и ул. Алба Юлия 23, тел. +373 69 482 293) является информационной витриной и не собирает персональные данные через онлайн-формы.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>2. Техническое хранение (необходимое):</strong> Ключ <code>gymbeer_cookie_consent_v2</code> в <code>localStorage</code> сохраняет ваш выбор («accepted» или «rejected») и не передаёт данные третьим лицам.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>3. Опциональные аналитические и рекламные cookies (только по согласию Opt-In — «Принять»):</strong> По умолчанию все рекламные модули заблокированы (Google Consent Mode v2: <code>denied</code>). Только если вы нажимаете «Принять», могут использоваться: <code>_ga</code> (Google Analytics 4 — анонимная статистика посещений, до 13–24 мес.), <code>_gcl_au</code> (Google Ads — 90 дней) и <code>_fbp</code> / <code>_fbc</code> (Meta Pixel — оценка эффективности рекламы в Instagram/Facebook и учёт звонков/переходов в карты, 90 дней). При выборе «Только необходимые» эти cookies не загружаются и удаляются.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 14px"><strong>4. Ваши права (Закон № 133/2011):</strong> Вы можете в любой момент изменить или отозвать согласие кнопкой ниже, а также обратиться по тел. +373 69 482 293 или в надзорный орган <strong>CNPDCP (datepersonale.md)</strong>.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button type="button" data-reset="1" style="padding:7px 14px;border-radius:6px;border:1.5px solid #1f2a22;background:#efe2c6;color:#1f2a22;font-weight:700;cursor:pointer">Сбросить выбор Cookies</button>
          <button type="button" data-close="1" style="padding:7px 16px;border-radius:6px;border:1.5px solid #1f2a22;background:#1f2a22;color:#f3e6c9;font-weight:700;cursor:pointer">Понятно</button>
        </div>
      </div>` : `
      <div style="max-width:620px;width:100%;max-height:86vh;overflow-y:auto;background:#fbf8f0;color:#1f2a22;border:2px solid #1f2a22;border-radius:12px;padding:22px 24px;box-shadow:6px 6px 0 #d2a557">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px">
          <h2 style="margin:0;font-size:19px">Politica de Confidențialitate &amp; Cookies (Legea nr. 133/2011 RM)</h2>
          <button type="button" data-close="1" style="border:1.5px solid #1f2a22;background:#efe2c6;border-radius:6px;padding:4px 10px;font-weight:800;cursor:pointer">✕</button>
        </div>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>1. Informații generale:</strong> Site-ul <strong>gymbeermd.site</strong> (magazinele GYM BEER, mun. Chișinău, Str. Cuza Vodă 1/4 și Str. Alba Iulia 23, tel. +373 69 482 293) este o pagină informativă de prezentare și nu colectează date personale prin formulare online.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>2. Stocare tehnică strict necesară:</strong> Cheia <code>gymbeer_cookie_consent_v2</code> din <code>localStorage</code> reține local opțiunea ta („accepted” sau „rejected”) ca să nu îți reafișăm bara la fiecare pagină.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 10px"><strong>3. Cookies opționale de statistică și marketing (strict cu consimțământ Opt-In — „Acceptă”):</strong> În mod implicit, orice modul publicitar este blocat (Google Consent Mode v2: <code>denied</code>). Exclusiv dacă apeși „Acceptă”, se pot activa: <code>_ga</code> (Google Analytics 4 — statistici anonime de trafic, max. 13–24 luni), <code>_gcl_au</code> (Google Ads — 90 zile) și <code>_fbp</code> / <code>_fbc</code> (Meta Pixel — măsurarea eficienței reclamelor pe Instagram/Facebook și numărarea apelurilor sau deschiderilor locației pe hartă, 90 zile). Dacă alegi „Doar Necesare”, niciun cookie de marketing nu este setat.</p>
        <p style="font-size:13.5px;line-height:1.55;margin:0 0 14px"><strong>4. Drepturile tale (Legea nr. 133/2011):</strong> Îți poți retrage sau modifica oricând acordul cu butonul de mai jos, ne poți contacta la +373 69 482 293 sau te poți adresa <strong>Centrului Național pentru Protecția Datelor cu Caracter Personal (CNPDCP — datepersonale.md)</strong>.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button type="button" data-reset="1" style="padding:7px 14px;border-radius:6px;border:1.5px solid #1f2a22;background:#efe2c6;color:#1f2a22;font-weight:700;cursor:pointer">Resetează / Retrage Consimțământul</button>
          <button type="button" data-close="1" style="padding:7px 16px;border-radius:6px;border:1.5px solid #1f2a22;background:#1f2a22;color:#f3e6c9;font-weight:700;cursor:pointer">Închide</button>
        </div>
      </div>`;
    m.addEventListener('click', ev => {
      if (ev.target === m || ev.target.closest('[data-close]')) m.remove();
      if (ev.target.closest('[data-reset]')) {
        try { localStorage.removeItem(CONSENT_KEY); } catch {}
        clearMarketingCookies();
        m.remove();
        renderBanner();
      }
    });
    document.body.appendChild(m);
  }
  window.openGymBeerCookiePolicy = openPolicyModal;

  // Adaugă link discret „Cookies & Confidențialitate” în subsolul tuturor paginilor
  const footerBase = document.querySelector('.footer-base');
  if (footerBase && !footerBase.querySelector('[data-cookie-link]')) {
    const lk = document.createElement('button');
    lk.type = 'button';
    lk.setAttribute('data-cookie-link', '1');
    lk.style.cssText = 'background:none;border:none;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0;opacity:0.88';
    lk.textContent = isRu ? 'Cookies и конфиденциальность' : 'Cookies & Confidențialitate';
    lk.addEventListener('click', openPolicyModal);
    footerBase.appendChild(lk);
  }

  function renderBanner() {
    document.getElementById('wsod-cookie-bar')?.remove();
    const bar = document.createElement('aside');
    bar.id = 'wsod-cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', isRu ? 'Настройки cookie' : 'Preferințe cookies');
    bar.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);width:min(740px,calc(100vw - 28px));z-index:9999;padding:13px 18px;border-radius:9px;background:#efe2c6;color:#1f2a22;border:2px solid #1f2a22;outline:1.5px solid rgba(31,42,34,0.35);outline-offset:-6px;box-shadow:4px 4px 0 #d2a557,0 14px 28px rgba(29,36,30,0.22);font-family:Inter,system-ui,sans-serif;font-size:12.5px;line-height:1.45';
    bar.innerHTML = `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px"><div style="flex:1 1 390px"><span style="display:inline-block;background:#f0b43c;color:#1f2a22;border:1.5px solid #1f2a22;border-radius:999px;padding:2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.08em;margin-right:7px">COOKIES</span>${isRu ? 'Мы используем технически необходимые файлы cookie и, только с вашего согласия, статистику и оценку рекламы (Google / Meta).' : 'Folosim cookies strict necesare funcționării site-ului și, doar cu acordul tău, statistici și măsurarea reclamelor (Google / Meta).'} <button type="button" data-policy="1" style="background:none;border:none;padding:0;color:#1f2a22;font-weight:800;text-decoration:underline;cursor:pointer;font-size:12.5px">${isRu ? 'Политика Cookies' : 'Politica Cookies'}</button>.</div><div style="display:flex;gap:8px;align-items:center;margin-left:auto"><button type="button" data-consent="rejected" style="padding:7px 13px;border-radius:5px;border:1.5px solid #1f2a22;background:#fbf8f0;color:#1f2a22;font-size:12px;font-weight:700;cursor:pointer">${isRu ? 'Только необходимые' : 'Doar Necesare'}</button><button type="button" data-consent="accepted" style="padding:7px 15px;border-radius:5px;border:1.5px solid #1f2a22;background:#1f2a22;color:#f3e6c9;box-shadow:3px 3px 0 #d2a557;font-size:12px;font-weight:700;cursor:pointer">${isRu ? 'Принять' : 'Acceptă'}</button></div></div>`;
    bar.addEventListener('click', ev => {
      if (ev.target.closest('[data-policy]')) { openPolicyModal(); return; }
      const btn = ev.target.closest('button[data-consent]'); if (!btn) return;
      const choice = btn.dataset.consent;
      try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
      bar.remove();
      if (choice === 'accepted') bootConsentedPixels(); else clearMarketingCookies();
    });
    document.body.appendChild(bar);
  }
  window.openWsodCookieSettings = renderBanner;
  let saved = null; try { saved = localStorage.getItem(CONSENT_KEY); } catch {}
  if (saved === 'accepted') bootConsentedPixels();
  else if (saved !== 'rejected') renderBanner();
})();
