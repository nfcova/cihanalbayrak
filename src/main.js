import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from './config.js';

gsap.registerPlugin(ScrollTrigger);
window.__siteReady = true;

const root = document.documentElement;
const body = document.body;
const motion = root.classList.contains('motion');
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ==========================================================================
   İletişim bağlantıları (src/config.js)
   ========================================================================== */

function buildLinks() {
  const ig = (site.instagram || '').trim().replace(/^@/, '');
  const wa = (site.whatsapp || '').replace(/\D/g, '');
  const email = (site.email || '').trim();
  const msg = encodeURIComponent(site.educationMessage || '');

  const links = {
    instagram: ig ? { href: `https://www.instagram.com/${ig}/`, label: `@${ig}` } : null,
    whatsapp: wa ? { href: `https://wa.me/${wa}`, label: `+${wa}` } : null,
    email: email ? { href: `mailto:${email}`, label: email } : null,
  };
  links.education = wa
    ? { href: `https://wa.me/${wa}?text=${msg}` }
    : email
      ? { href: `mailto:${email}?subject=${encodeURIComponent('Eğitim hakkında bilgi')}&body=${msg}` }
      : null;
  return links;
}

function applyLinks() {
  const links = buildLinks();

  $$('[data-link]').forEach((a) => {
    const cfg = links[a.dataset.link];
    if (cfg) {
      a.href = cfg.href;
      if (cfg.href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener';
      } else {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    } else {
      // Bilgi henüz girilmediyse iletişim bölümüne yönlendir.
      a.href = '#iletisim';
      a.removeAttribute('target');
      a.removeAttribute('rel');
      a.classList.add('is-pending');
    }
  });

  $$('[data-value]').forEach((el) => {
    const cfg = links[el.dataset.value];
    el.textContent = cfg ? cfg.label : 'Yakında';
  });

  // Instagram video kartları: kendi linki yoksa profile (o da yoksa iletişime) yönlendir.
  $$('.reel').forEach((a) => {
    if (a.getAttribute('href') && a.getAttribute('href') !== '#') {
      a.target = '_blank';
      a.rel = 'noopener';
      return;
    }
    a.href = links.instagram ? links.instagram.href : '#iletisim';
    if (links.instagram) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}

/* ==========================================================================
   Navigasyon
   ========================================================================== */

function initNav() {
  const nav = $('[data-nav]');
  const toggle = $('.nav__toggle', nav);
  const label = $('.visually-hidden', toggle);
  const links = $$('.nav__link', nav);

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Menüyü kapat' : 'Menüyü aç';
    body.classList.toggle('is-locked', open);
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  links.forEach((l) => l.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setOpen(false));

  // Arka plan + aşağı kaydırırken gizle / yukarı kaydırırken göster
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8);
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true },
  );
  onScroll();

  // Aktif bölüm
  const map = new Map(links.map((l) => [l.getAttribute('href').slice(1), l]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => {
          l.classList.remove('is-active');
          l.removeAttribute('aria-current');
        });
        const active = map.get(entry.target.id);
        if (active) {
          active.classList.add('is-active');
          active.setAttribute('aria-current', 'true');
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  $$('main section[id]').forEach((s) => io.observe(s));
}

/* ==========================================================================
   Hero video
   ========================================================================== */

function initHeroVideo() {
  const hero = $('.hero');
  const video = $('.hero__video');
  if (!video) return;

  const showVideo = () => hero.classList.add('is-playing');
  const fail = () => hero.classList.remove('is-playing'); // alternatif görsel görünür kalır

  video.addEventListener('playing', showVideo);
  video.addEventListener('error', fail);
  $('source', video)?.addEventListener('error', fail);

  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(fail);
  };

  if (root.classList.contains('motion') || !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tryPlay();
  }

  // Ekran dışındayken durdur (performans / pil)
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (video.paused && !matchMedia('(prefers-reduced-motion: reduce)').matches) tryPlay();
      } else if (!video.paused) {
        video.pause();
      }
    },
    { threshold: 0.05 },
  ).observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
  });
}

/* ==========================================================================
   Instagram videoları
   ========================================================================== */

function initReels() {
  const reels = $$('.reel').filter((r) => r.dataset.src);
  if (!reels.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const v = target.querySelector('video');
        if (!v) return;
        if (isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    },
    { threshold: 0.35 },
  );

  reels.forEach((reel) => {
    const media = $('.reel__media', reel);
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('aria-hidden', 'true');
    if (reel.dataset.poster) v.poster = reel.dataset.poster;
    v.src = reel.dataset.src;
    v.addEventListener('loadeddata', () => $('.reel__placeholder', reel)?.remove(), { once: true });
    media.prepend(v);
    io.observe(reel);
  });
}

/* ==========================================================================
   Yazı bölme
   ========================================================================== */

function splitTitles() {
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`)
      .join(' ');
    el.classList.add('is-split');
  });
}

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c;
    el.appendChild(s);
  });
  return $$('.ch', el);
}

/* ==========================================================================
   Açılış (intro) + hero girişi
   ========================================================================== */

function heroIn() {
  const tl = gsap.timeline();
  tl.fromTo('.hero__media', { scale: 1.22 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
    .fromTo(
      '[data-hero-line]',
      { yPercent: 110, opacity: 1 },
      { yPercent: 0, duration: 1.4, stagger: 0.14, ease: 'power4.out' },
      0.35,
    )
    .fromTo(
      '[data-hero-item]',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: 'power3.out', clearProps: 'transform' },
      0.7,
    )
    .fromTo('[data-nav]', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 1, clearProps: 'all' }, 1);
  return tl;
}

function runIntro() {
  const intro = $('.intro');
  if (!intro) return Promise.resolve();

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const finish = () => {
    intro.remove();
    if (!$('.nav.is-open')) body.classList.remove('is-locked');
    ScrollTrigger.refresh();
  };

  // Hareket azaltma tercihi: isim kısa süre görünür, ardından sade bir geçiş.
  if (!motion) {
    body.classList.add('is-locked');
    return new Promise((resolve) => {
      setTimeout(() => {
        intro.style.transition = 'opacity .6s';
        intro.style.opacity = '0';
        setTimeout(() => {
          finish();
          resolve();
        }, 650);
      }, 1200);
    });
  }

  body.classList.add('is-locked');
  gsap.set('[data-nav]', { autoAlpha: 0 });

  const first = splitChars($('.intro__word--first'));
  const last = splitChars($('.intro__word--last'));
  const skip = $('.intro__skip');

  return new Promise((resolve) => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.intro__light', { opacity: 1, duration: 1.8, ease: 'sine.inOut' }, 0.2)
      .fromTo(
        first,
        { opacity: 0, yPercent: 70, filter: 'blur(14px)' },
        { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.08 },
        0.6,
      )
      .fromTo(
        last,
        { opacity: 0, yPercent: 70, filter: 'blur(14px)' },
        { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.055 },
        1.45,
      )
      .to('.intro__line', { scaleY: 1, duration: 1, ease: 'power2.inOut' }, 2.2)
      .to(skip, { opacity: 1, duration: 0.6 }, 1)
      .addLabel('out', 3.6)
      .to(
        '.intro__name',
        { opacity: 0, scale: 1.06, filter: 'blur(8px)', duration: 1, ease: 'power2.in' },
        'out',
      )
      .to(['.intro__light', '.intro__line', skip], { opacity: 0, duration: 0.7, ease: 'power1.in' }, 'out')
      .to('.intro__curtain--left', { xPercent: -101, duration: 1.6, ease: 'expo.inOut' }, 'out+=0.75')
      .to('.intro__curtain--right', { xPercent: 101, duration: 1.6, ease: 'expo.inOut' }, '<')
      .add(heroIn(), 'out+=1.15');

    let skipped = false;
    const doSkip = () => {
      if (skipped) return;
      skipped = true;
      if (tl.time() < tl.labels.out) tl.seek('out');
      tl.timeScale(1.8);
    };
    skip.addEventListener('click', doSkip);
    intro.addEventListener('click', doSkip);
    const onKey = (e) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) doSkip();
    };
    document.addEventListener('keydown', onKey);
    tl.eventCallback('onComplete', () => {
      document.removeEventListener('keydown', onKey);
      finish();
      resolve();
    });
  });
}

/* ==========================================================================
   Kaydırma animasyonları
   ========================================================================== */

function initScrollAnimations() {
  if (!motion) return;

  // Bölüm başlıkları — kelime kelime perde açılışı
  $$('[data-split]').forEach((title) => {
    const words = $$('.w > span', title);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: title,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.3, stagger: 0.07, ease: 'power4.out' }),
    });
  });

  // Metin ve blokların yumuşak girişi
  ScrollTrigger.batch('[data-reveal]:not([data-reveal="image"])', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: 'power3.out',
        overwrite: true,
      }),
  });

  // Fotoğraflar — sahne perdesi gibi açılış + hafif zoom + parallax
  $$('[data-reveal="image"]').forEach((fig) => {
    const img = $('img', fig);
    gsap
      .timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .to(fig, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' })
      .fromTo(img, { '--s': 1.35 }, { '--s': 1.08, duration: 2.2, ease: 'expo.out' }, 0);

    gsap.fromTo(
      img,
      { '--y': '-4%' },
      {
        '--y': '4%',
        ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Hero — kaydırırken sinematik çıkış
  gsap.to('.hero__content', {
    yPercent: -35,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__shade', {
    opacity: 1,
    backgroundColor: 'rgba(8,8,8,0.9)',
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.scroll-cue', {
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true },
  });

  // İletişim ışığı
  gsap.fromTo(
    '.contact__glow',
    { opacity: 0, scale: 0.7 },
    {
      opacity: 1,
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true },
    },
  );
}

/* ==========================================================================
   Başlat
   ========================================================================== */

applyLinks();
initNav();
initHeroVideo();
initReels();
splitTitles();
initScrollAnimations();
runIntro();
