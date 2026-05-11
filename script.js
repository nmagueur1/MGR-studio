/* ============================================================
   MGR STUDIO — Nathan Magueur
   Portfolio Football · Interactions
   ============================================================ */

// Catalogues complets pour le "Voir plus" + lightbox
const PHOTO_LIBRARY = {
  match: Array.from({ length: 29 }, (_, i) => `assets/photos/match/match-${String(i + 1).padStart(2, '0')}.jpg`),
  emotions: Array.from({ length: 17 }, (_, i) => `assets/photos/emotions/emotion-${String(i + 1).padStart(2, '0')}.jpg`),
  story: Array.from({ length: 14 }, (_, i) => `assets/photos/story/story-${String(i + 1).padStart(2, '0')}.jpg`),
};

const ALT_LABELS = {
  match: 'Match · Action',
  emotions: 'Émotion',
  story: 'Story · Off-field',
};

/* ============================================================
   1. NAV — scroll behavior + mobile menu
   ============================================================ */
(() => {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  let lastScroll = 0;
  function onScroll() {
    const y = window.scrollY;
    if (y > 60) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileLinks.forEach((a) =>
      a.addEventListener('click', () => {
        burger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      })
    );
  }
})();

/* ============================================================
   2. HERO — auto-rotation des slides
   ============================================================ */
(() => {
  const slides = document.querySelectorAll('.hero__slide');
  if (slides.length < 2) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 5500);
})();

/* ============================================================
   3. REVEAL on scroll (Intersection Observer)
   ============================================================ */
(() => {
  // Marquer automatiquement les sections importantes
  const candidates = [
    '.about__col--text',
    '.about__image-wrap',
    '.portfolio__intro',
    '.portfolio-block__header',
    '.services__head',
    '.bio__image-col',
    '.bio__text-col',
    '.contact__head',
    '.contact__info',
    '.contact__form',
  ];
  candidates.forEach((sel) =>
    document.querySelectorAll(sel).forEach((el) => el.classList.add('reveal'))
  );

  // Stagger pour les grids
  document.querySelectorAll('.about__pillars, .services__grid, .logos-grid, .grid')
    .forEach((el) => el.classList.add('reveal-stagger'));

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => obs.observe(el));
})();

/* ============================================================
   4. SEE MORE — étend la grille avec le reste des photos
   ============================================================ */
(() => {
  document.querySelectorAll('.see-more').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const grid = document.querySelector(`#${target} .grid`);
      const lib = PHOTO_LIBRARY[target];
      if (!grid || !lib) return;

      const expanded = btn.getAttribute('aria-expanded') === 'true';

      if (!expanded) {
        // Identifier les photos déjà affichées
        const already = new Set(
          [...grid.querySelectorAll('.grid__item img')].map((img) => img.getAttribute('src'))
        );

        let added = 0;

        lib.forEach((src) => {
          if (already.has(src)) return;
          const fig = document.createElement('figure');
          fig.className = 'grid__item';
          fig.dataset.photo = src;
          fig.style.opacity = '0';
          fig.style.transition = 'opacity .8s cubic-bezier(.2,.8,.2,1)';
          fig.innerHTML = `<img src="${src}" alt="${ALT_LABELS[target]}" loading="lazy" />`;
          grid.appendChild(fig);
          // Animation d'apparition échelonnée (masonry => pas de translateY pour éviter de casser le flow)
          requestAnimationFrame(() => {
            setTimeout(() => {
              fig.style.opacity = '1';
            }, added * 50);
          });
          added++;
        });

        btn.querySelector('.see-more__text').textContent = 'Voir moins';
        btn.setAttribute('aria-expanded', 'true');
        btn.dataset.expanded = 'true';
      } else {
        // Garder les premiers items, retirer les ajoutés dynamiquement
        const items = grid.querySelectorAll('.grid__item');
        const initialCount = parseInt(btn.dataset.initial || items.length - (lib.length - items.length), 10);
        // Re-render: simplement enlever les derniers ajoutés
        const dynamic = grid.querySelectorAll('.grid__item:nth-child(n+' + (parseInt(btn.dataset.initialCount) + 1) + ')');
        dynamic.forEach((el) => el.remove());

        btn.querySelector('.see-more__text').textContent = 'Voir plus';
        btn.setAttribute('aria-expanded', 'false');
        btn.dataset.expanded = 'false';

        // Scroll back vers le bloc
        document.getElementById(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Sauvegarder le nombre initial
    const grid = document.querySelector(`#${btn.dataset.target} .grid`);
    if (grid) btn.dataset.initialCount = grid.querySelectorAll('.grid__item').length;
  });
})();

/* ============================================================
   5. LIGHTBOX
   ============================================================ */
(() => {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCaption');
  const close = document.getElementById('lightboxClose');
  const prev = document.getElementById('lightboxPrev');
  const next = document.getElementById('lightboxNext');

  if (!lb) return;

  let currentBlock = null; // 'match' | 'emotions' | 'story'
  let currentIndex = 0;
  let currentList = [];

  function open(block, src) {
    currentBlock = block;
    currentList = PHOTO_LIBRARY[block] || [src];
    currentIndex = Math.max(0, currentList.indexOf(src));
    show();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function show() {
    const src = currentList[currentIndex];
    lbImg.src = src;
    lbImg.alt = ALT_LABELS[currentBlock] || '';
    lbCap.textContent = `${ALT_LABELS[currentBlock] || ''} — ${currentIndex + 1} / ${currentList.length}`;
  }

  function closeLB() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 400);
  }

  function nav(dir) {
    if (!currentList.length) return;
    currentIndex = (currentIndex + dir + currentList.length) % currentList.length;
    show();
  }

  // Bind clicks sur les figures
  function bindFigures() {
    document.querySelectorAll('.portfolio-block').forEach((block) => {
      const blockId = block.id;
      if (!PHOTO_LIBRARY[blockId]) return;
      block.querySelectorAll('.grid__item').forEach((fig) => {
        if (fig.dataset.lbBound) return;
        fig.dataset.lbBound = 'true';
        fig.addEventListener('click', () => {
          const src = fig.dataset.photo || fig.querySelector('img')?.getAttribute('src');
          if (src) open(blockId, src);
        });
      });
    });
  }

  // Initial bind + ré-observer dynamiquement (pour les éléments ajoutés via "Voir plus")
  bindFigures();
  const mo = new MutationObserver(bindFigures);
  document.querySelectorAll('.portfolio-block .grid').forEach((g) =>
    mo.observe(g, { childList: true })
  );

  close.addEventListener('click', closeLB);
  prev.addEventListener('click', () => nav(-1));
  next.addEventListener('click', () => nav(1));
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLB();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
})();

/* ============================================================
   6. CONTACT FORM — soumission via mailto (no backend)
   ============================================================ */
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const type = (data.get('type') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    if (!name || !email || !type || !message) {
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Tous les champs sont requis';
      btn.style.background = 'transparent';
      btn.style.color = '#e63946';
      btn.style.borderColor = '#e63946';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 2200);
      return;
    }

    const subject = `Demande ${type} — ${name}`;
    const body = `Nom / Club: ${name}%0D%0AEmail: ${email}%0D%0AType: ${type}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(message)}`;
    const mailto = `mailto:nmagueur1@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

    // Feedback visuel
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Ouverture de votre messagerie…';
    setTimeout(() => {
      window.location.href = mailto;
      btn.textContent = original;
    }, 400);
  });
})();

/* ============================================================
   7. FOOTER — année dynamique
   ============================================================ */
(() => {
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
