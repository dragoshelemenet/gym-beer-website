'use strict';
(() => {
  const menu = document.querySelector('.menu-trigger');
  const mobile = document.querySelector('#mobile-menu');
  if (menu && mobile) {
    const close = () => {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Deschide meniul');
      mobile.hidden = true;
      document.body.classList.remove('menu-open');
    };
    menu.addEventListener('click', () => {
      if (menu.getAttribute('aria-expanded') === 'true') { close(); return; }
      menu.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-label', 'Închide meniul');
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
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Fotografie');
  box.innerHTML = '<div class="lightbox-frame"><div class="lightbox-img" role="img"></div><div class="lightbox-shield"></div>' +
    '<p class="lightbox-cap"></p><button class="lightbox-close" type="button" aria-label="Închide fotografia">×</button></div>';
  document.body.appendChild(box);
  const img = box.querySelector('.lightbox-img'), cap = box.querySelector('.lightbox-cap');
  let last = null;
  const open = (src, text) => {
    last = document.activeElement;
    img.style.backgroundImage = `url("${src}")`;
    img.setAttribute('aria-label', text || 'Fotografie GYM BEER');
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
    const p = e.target.closest('[data-photo]');
    if (p) { e.preventDefault(); open(p.dataset.photo, p.dataset.caption); }
  });
})();

/* Protecție de bază pentru fotografii: fără click-dreapta, tragere sau salvare prin apăsare lungă. */
(() => {
  const isPhoto = el => el && el.closest && el.closest('img, .gallery-tile, .lightbox, .snack-photo, .stamp, .feature-photo, .hero-collage, .editorial-photo, .subhero-photo, .gallery-preview, [data-photo]');
  document.addEventListener('contextmenu', e => { if (isPhoto(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (isPhoto(e.target)) e.preventDefault(); });
})();
