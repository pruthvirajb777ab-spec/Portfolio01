/* Pruthvi's portfolio: all interactions in one place */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Animated name: split into letters */
  const nameEl = $('#name');
  [...nameEl.textContent].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.animationDelay = `${1.4 + i * 0.08}s`;
    nameEl.appendChild(s);
  });
  nameEl.firstChild.textContent = ''; // remove the original text node (the letter spans remain)

  /* Loader */
  const pct = $('#loadPct');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(100, n + Math.ceil(Math.random() * 12));
    pct.textContent = n;
    if (n >= 100) {
      clearInterval(tick);
      setTimeout(() => $('#loader').classList.add('done'), 250);
    }
  }, 90);

  /* Footer year */
  $('#year').textContent = new Date().getFullYear();

  /* Nav: scrolled state, active link, mobile menu */
  const header = $('#nav'), menu = $('#menu'), burger = $('#burger'), toTop = $('#toTop');
  const links = $$('nav a');
  const toggleMenu = open => {
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 30);
    toTop.classList.toggle('show', scrollY > 600);
  }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const secObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section').forEach(s => secObs.observe(s));

  /* Scroll reveal + skill bars */
  $$('.skill .bar').forEach(bar => {
    if (!bar.parentElement.dataset.level) bar.classList.add('explore');
  });
  const revObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      const lvl = parseInt(e.target.dataset.level, 10);
      if (!isNaN(lvl)) $('.bar b', e.target).style.width = Math.max(0, Math.min(100, lvl)) + '%';
      revObs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    revObs.observe(el);
  });

  /* CV button: friendly message if cv.pdf has not been uploaded yet */
  const toast = $('#toast');
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };
  $('#cvBtn').addEventListener('click', e => {
    if (location.protocol === 'file:') return; // local preview: let the browser handle it
    e.preventDefault();
    fetch('cv.pdf', { method: 'HEAD' })
      .then(r => {
        if (!r.ok) throw new Error();
        const a = document.createElement('a');
        a.href = 'cv.pdf'; a.download = 'Pruthvi-CV.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      })
      .catch(() => say('CV not added yet. Upload a file named cv.pdf to your repository.'));
  });

  /* Hero 3D tilt following pointer */
  const scene = $('#scene');
  if (scene && !reduceMotion) {
    addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      scene.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`;
    }, { passive: true });
  }

  /* Project card tilt (desktop) */
  if (desktop && !reduceMotion) {
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    });
  }

  /* Custom cursor (desktop only) */
  if (desktop) {
    const ring = $('#cursor'), dot = $('#cursorDot');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.body.classList.add('has-cursor');
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    $$('a, button').forEach(el => {
      el.addEventListener('pointerenter', () => ring.classList.add('big'));
      el.addEventListener('pointerleave', () => ring.classList.remove('big'));
    });
  }

  /* Animated particle background (lightweight canvas) */
  const cv = $('#bg'), ctx = cv.getContext('2d');
  let W, H, pts = [];
  const mouse = { x: -999, y: -999 };
  const resize = () => {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const count = Math.min(80, Math.floor(W * H / 16000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35
    }));
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p, i) => {
      if (!reduceMotion) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, 6.283);
      ctx.fillStyle = 'rgba(192,132,252,.7)';
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(124,58,237,${0.22 * (1 - d / 120)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (md < 150) {
        ctx.strokeStyle = `rgba(192,132,252,${0.4 * (1 - md / 150)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    });
    requestAnimationFrame(draw);
  };
  draw();
})();
