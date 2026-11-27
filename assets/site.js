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
  function renderBanner() {
    document.getElementById('wsod-cookie-bar')?.remove();
    const bar = document.createElement('aside');
    bar.id = 'wsod-cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', isRu ? 'Настройки cookie' : 'Preferințe cookies');
    bar.style.cssText = 'position:fixed;bottom:14px;left:14px;right:14px;max-width:520px;z-index:9999;padding:13px 16px;border-radius:14px;background:rgba(22,20,18,0.95);color:#f7f6f2;border:1px solid rgba(255,255,255,0.16);box-shadow:0 12px 32px rgba(0,0,0,0.38);font-family:Inter,system-ui,sans-serif;font-size:12.5px;line-height:1.45;backdrop-filter:blur(12px)';
    bar.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px"><div><strong style="color:#f5c451">${isRu ? 'Cookies и конфиденциальность:' : 'Cookies & Confidențialitate:'}</strong> ${isRu ? 'Мы используем технически необходимые файлы cookie и, только с вашего согласия, статистику и оценку рекламы (Google / Meta).' : 'Folosim cookies strict necesare funcționării site-ului și, doar cu acordul tău, statistici și măsurarea reclamelor (Google / Meta).'}</div><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" data-consent="rejected" style="padding:6px 13px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);background:transparent;color:#f7f6f2;font-size:12px;font-weight:600;cursor:pointer">${isRu ? 'Только необходимые' : 'Doar Necesare'}</button><button type="button" data-consent="accepted" style="padding:6px 15px;border-radius:999px;border:1px solid #f5c451;background:#f5c451;color:#161412;font-size:12px;font-weight:700;cursor:pointer">${isRu ? 'Принять' : 'Acceptă'}</button></div></div>`;
    bar.addEventListener('click', ev => {
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
