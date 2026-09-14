/* DJ KREOBASS - Portfolio JavaScript */
'use strict';

/* ── Particles (étincelles dorées flottantes) ── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  const COLORS = ['rgba(212,175,55,', 'rgba(244,229,161,', 'rgba(140,106,47,'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomParticle() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 1.8 + 0.3,
      vx:   (Math.random() - 0.5) * 0.25,
      vy:   (Math.random() - 0.5) * 0.25,
      a:    Math.random() * 0.5 + 0.15,
      da:   (Math.random() - 0.5) * 0.004,
      color: c,
    };
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 9000), 120);
    particles = Array.from({ length: count }, randomParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.a  += p.da;
      if (p.a < 0.05) p.da = Math.abs(p.da);
      if (p.a > 0.65)  p.da = -Math.abs(p.da);
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.a + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  init();
  draw();
})();

/* ── Navbar scroll ── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveLink();
  }, { passive: true });

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu.classList.toggle('open');
  });

  menu?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle?.classList.remove('open');
      menu.classList.remove('open');
    });
  });

  function updateActiveLink() {
    const scrollY = window.scrollY + 100;
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (!section) return;
      const { offsetTop, offsetHeight } = section;
      link.classList.toggle('active', scrollY >= offsetTop && scrollY < offsetTop + offsetHeight);
    });
  }
})();

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;
    window.scrollTo({ top: target.offsetTop - navH + 1, behavior: 'smooth' });
  });
});

/* ── Footer year ── */
(function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── Date minimum = aujourd'hui ── */
(function setMinDate() {
  const el = document.getElementById('event_date');
  if (el) el.min = new Date().toISOString().split('T')[0];
})();

/* ── Ticker musical ── */
function renderTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  const genres = ['Disco','Funk','Soul','Rock','New Wave','Synthpop','Hip-Hop','R&B',
    'House','Techno','Jungle','Ragga','Dancehall','Moombahton','Dubstep','Reggaeton',
    'Afrobeats','Amapiano','Trap','SoundSystem','Reggae','Pop','Électro','DJ KREOBASS'];
  const all = genres.concat(genres);
  track.innerHTML = all.map(g => `
    <span class="ticker-item">
      <span class="ticker-sep"></span>
      ${g}
    </span>`).join('');
}

/* ── Genre color helper ── */
function genreColor(genre) {
  const g = genre.toLowerCase();
  if (g.includes('soundsystem') || g.includes('reggae') || g.includes('bass')) return 'g-bleu';
  return '';
}

/* ── Mixes (rendu + play/pause) ── */
function renderMixes(mixes) {
  const grid = document.getElementById('mixes-grid');
  if (!grid) return;
  grid.innerHTML = mixes.map((mix, i) => `
    <article class="mix-card reveal" data-index="${i}" aria-label="${escapeHtml(mix.title)}">
      <div class="mix-artwork">
        <div class="mix-artwork-placeholder">
          <div class="vinyl-disc"><div class="vinyl-center"></div></div>
        </div>
        <button class="mix-play-btn" aria-label="Écouter ${escapeHtml(mix.title)}">
          <svg class="play-icon"  viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
      </div>
      <div class="mix-info">
        <h3 class="mix-title">${escapeHtml(mix.title)}</h3>
        <span class="mix-genre ${genreColor(mix.genre)}">${escapeHtml(mix.genre)}</span>
        <div class="mix-meta">
          <span class="mix-duration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${escapeHtml(mix.duration)}
          </span>
          <span class="mix-date">${escapeHtml(mix.year)}</span>
        </div>
        <div class="mix-waveform" aria-hidden="true">
          ${randomWaveform(i)}
        </div>
      </div>
    </article>`).join('');

  initMixCards();
}

function randomWaveform(seed) {
  let bars = '';
  let s = seed * 17 + 1;
  for (let i = 0; i < 40; i++) {
    s = (s * 9301 + 49297) % 233280;
    const h = 12 + Math.floor((s / 233280) * 88);
    bars += `<div class="waveform-bar" style="height:${h}%"></div>`;
  }
  return bars;
}

function initMixCards() {
  let currentCard = null;
  document.querySelectorAll('.mix-card').forEach(card => {
    const btn       = card.querySelector('.mix-play-btn');
    const playIcon  = card.querySelector('.play-icon');
    const pauseIcon = card.querySelector('.pause-icon');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isPlaying = card.classList.contains('playing');

      if (currentCard && currentCard !== card) {
        currentCard.classList.remove('playing');
        currentCard.querySelector('.play-icon').style.display  = '';
        currentCard.querySelector('.pause-icon').style.display = 'none';
      }

      card.classList.toggle('playing', !isPlaying);
      playIcon.style.display  = isPlaying ? ''       : 'none';
      pauseIcon.style.display = isPlaying ? 'none'   : '';
      currentCard = isPlaying ? null : card;
    });
  });
}

/* ── Tarifs / Pricing ── */
function renderPricing(pricing) {
  const grid = document.getElementById('pricing-grid');
  if (!grid) return;
  grid.innerHTML = pricing.map(p => `
    <div class="pricing-card reveal">
      <div class="pricing-icon">${p.icon}</div>
      <h3 class="pricing-name">${escapeHtml(p.name)}</h3>
      <p class="pricing-desc">${escapeHtml(p.description)}</p>
      <ul class="pricing-features">
        ${p.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>
      <div class="pricing-quote">Sur devis</div>
      <a href="#contact" class="btn btn-outline btn-full">Demander un devis</a>
    </div>`).join('');
}

/* ── Événements (rendu + filtre) ── */
let allEvents     = [];
let staticEvents  = [];
let liveEvents    = [];

const MONTHS_ABBR_FR = ['jan','fév','mar','avr','mai','juin','juil','août','sept','oct','nov','déc'];
function eventSortKey(event) {
  const [dayStr, monthStr, yearStr] = (event.date || '').split(' ');
  const day   = parseInt(dayStr, 10) || 1;
  const year  = parseInt(yearStr, 10) || 0;
  const monthIndex = MONTHS_ABBR_FR.findIndex(m => (monthStr || '').toLowerCase().startsWith(m.slice(0, 3)));
  return new Date(year, monthIndex >= 0 ? monthIndex : 0, day).getTime();
}

function mergeAndRenderEvents() {
  const merged = [...staticEvents, ...liveEvents].sort((a, b) => eventSortKey(a) - eventSortKey(b));
  renderEvents(merged);
}

window.addEventListener('kb:confirmed-events', e => {
  liveEvents = e.detail || [];
  mergeAndRenderEvents();
});

function renderEvents(events) {
  allEvents = events;
  const list = document.getElementById('events-list');
  if (!list) return;
  list.innerHTML = events.map(event => {
    const parts = event.date.split(' ');
    const day   = parts[0] || '';
    const month = parts.slice(1).join(' ');
    const isPast = event.status === 'past';
    const isBookable = event.bookable !== false;
    return `
    <li class="event-item reveal ${isPast ? 'event-past' : ''}" data-status="${escapeHtml(event.status)}">
      <div class="event-date-box">
        <span class="event-day">${escapeHtml(day)}</span>
        <span class="event-month">${escapeHtml(month)}</span>
      </div>
      <div class="event-details">
        <h3 class="event-venue">${escapeHtml(event.venue)}</h3>
        <div class="event-meta">
          ${event.city ? `
          <span class="event-city">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(event.city)}
          </span>` : ''}
          ${event.time ? `
          <span class="event-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${escapeHtml(event.time)}
          </span>` : ''}
        </div>
      </div>
      <div class="event-status">
        ${isPast
          ? '<span class="status-badge past">Terminé</span>'
          : (isBookable
              ? '<a href="#contact" class="btn btn-sm btn-primary">Réserver</a>'
              : '<span class="status-badge confirmed">Confirmée</span>')}
      </div>
    </li>`;
  }).join('');

  initEventsFilter();
  applyEventFilter(document.querySelector('.filter-btn.active')?.dataset.filter || 'upcoming');
}

function applyEventFilter(filter) {
  document.querySelectorAll('.event-item').forEach(item => {
    const show = filter === 'all' || item.dataset.status === filter;
    item.style.display = show ? 'grid' : 'none';
  });
}

function initEventsFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.onclick = () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyEventFilter(btn.dataset.filter);
    };
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* ── Chargement des données (mixes / events / tarifs) ── */
(function loadData() {
  renderTicker();
  fetch('data/data.json')
    .then(res => res.json())
    .then(data => {
      renderMixes(data.mixes || []);
      staticEvents = data.events || [];
      mergeAndRenderEvents();
      renderPricing(data.pricing || []);
      initReveal();
    })
    .catch(err => console.error('Erreur de chargement des données :', err));
})();

/* ── Intersection Observer (reveal + skills + counters) ── */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
    if (!el.style.transitionDelay) el.style.transitionDelay = (i % 10 * 0.06) + 's';
    io.observe(el);
  });
}

(function initStaticReveal() {
  const map = [
    ['.about-image',      'reveal-left'],
    ['.about-content',    'reveal-right'],
    ['.contact-info',     'reveal-left'],
    ['.contact-form',     'reveal-right'],
    ['.section-header',   'reveal'],
    ['.era-card',         'reveal'],
    ['.gallery-item',     'reveal'],
    ['.highlight-card',   'reveal'],
    ['.reviews-widget',   'reveal'],
  ];
  map.forEach(([sel, cls]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add(cls);
      el.style.transitionDelay = (i * 0.08) + 's';
    });
  });
  initReveal();
})();

/* ── Skill bars ── */
(function initSkillBars() {
  const skillIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
      skillIo.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  const aboutSection = document.querySelector('.about-skills');
  if (aboutSection) skillIo.observe(aboutSection);
})();

/* ── Counters ── */
(function initCounters() {
  const counterIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-number[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count));
      });
      counterIo.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  const statsSection = document.querySelector('.about-stats');
  if (statsSection) counterIo.observe(statsSection);
})();

function animateCounter(el, target) {
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current + (target >= 100 ? '+' : '');
  }, 25);
}

/* ── Champ "Nom du lieu" : visible uniquement pour les soirées publiques (bar/guinguette) ── */
(function initVenueFieldToggle() {
  const select = document.getElementById('event_type');
  const group  = document.getElementById('venue_name_group');
  if (!select || !group) return;
  const sync = () => { group.hidden = select.value !== 'bar'; };
  select.addEventListener('change', sync);
  sync();
})();

/* ── Contact form (réservation Firestore + notification Formspree) ── */
(function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const calEl   = document.getElementById('booking-calendar');
  if (!form) return;

  function showResult(message, isError) {
    success.textContent = message;
    success.style.color = isError ? '#E05C2A' : '';
    success.hidden = false;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name    = form.querySelector('#name');
    const email   = form.querySelector('#email');
    const message = form.querySelector('#message');
    const eventType = form.querySelector('#event_type');
    let valid = true;

    [name, email, message].forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#CC5500';
        valid = false;
      }
    });

    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.style.borderColor = '#CC5500';
      valid = false;
    }

    const firebaseReady = window.FIREBASE_READY && window.Booking;
    let dateValue = form.querySelector('#event_date')?.value || '';
    calEl?.classList.remove('cal-error');

    if (firebaseReady) {
      dateValue = window.Booking.getSelectedDate();
      if (!dateValue) {
        calEl?.classList.add('cal-error');
        valid = false;
      }
    }

    if (!valid) {
      const firstInvalid = form.querySelector('[style*="CC5500"]');
      firstInvalid?.focus() || calEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    try {
      if (firebaseReady) {
        try {
          await window.Booking.createBooking({
            name: name.value,
            email: email.value,
            phone: '',
            eventType: eventType.value,
            date: dateValue,
            message: message.value,
            venueName: eventType.value === 'bar' ? (form.querySelector('#venue_name')?.value.trim() || '') : '',
          });
        } catch (bookingErr) {
          if (bookingErr.message === 'date-taken') {
            showResult('Cette date vient d’être réservée par quelqu’un d’autre — merci de choisir une autre date dans le calendrier.', true);
            return;
          }
          throw bookingErr;
        }
      }

      /* Notification email best-effort (n'empêche pas la réservation d'être validée) */
      try {
        await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
      } catch (notifyErr) {
        console.error('Notification email non envoyée :', notifyErr);
      }

      showResult(
        firebaseReady
          ? `Merci ${name.value} ! Ta demande pour le ${dateValue.split('-').reverse().join('/')} est enregistrée et en attente de confirmation. DJ KREOBASS te répondra très bientôt.`
          : `Merci ${name.value} ! Votre demande a bien été envoyée. DJ KREOBASS vous répondra très bientôt.`,
        false
      );
      form.reset();
    } catch (err) {
      showResult("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de contacter DJ KREOBASS directement via Facebook.", true);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });
})();

/* ── Progressive Web App : enregistrement du service worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.error('Échec enregistrement du service worker :', err);
    });
  });
}
