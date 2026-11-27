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

/* Meniu: filtru Tot / Doar băuturi / Doar gustări (se poate deschide direct cu #bauturi sau #gustari). */
(() => {
  const card = document.querySelector('.menu-card'); const tabs = document.querySelectorAll('.mc-filter [data-show]');
  if (!card || !tabs.length) return;
  const set = v => {
    card.dataset.show = v;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.show === v)));
    card.querySelectorAll('.mc-jump a').forEach(a => {
      const sec = document.querySelector(a.getAttribute('href'));
      a.hidden = v !== 'tot' && sec && !sec.closest(`[data-part="${v}"]`);
    });
  };
  tabs.forEach(t => t.addEventListener('click', () => { set(t.dataset.show); history.replaceState(null, '', t.dataset.show === 'tot' ? location.pathname : '#' + t.dataset.show); }));
  const h = location.hash.slice(1);
  if (h === "bauturi" || h === "gustari") { set(h); requestAnimationFrame(() => card.scrollIntoView({ block: "start" })); }
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
