/* DJ KREOBASS - Portfolio JavaScript */
'use strict';

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

/* ── Mixes (rendu + lecteur SoundCloud) ── */
function isPlayableSoundcloud(url) {
  return typeof url === 'string' && /^https?:\/\/(www\.)?(soundcloud\.com|on\.soundcloud\.com)\//.test(url);
}

function soundcloudEmbedSrc(url) {
  const params = new URLSearchParams({
    url,
    color: '#d4af37',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

function renderMixes(mixes) {
  const grid = document.getElementById('mixes-grid');
  if (!grid) return;
  grid.innerHTML = mixes.map((mix, i) => {
    const playable = isPlayableSoundcloud(mix.soundcloud_url);
    return `
    <article class="mix-card ${playable ? 'mix-card-live' : ''} reveal" data-index="${i}" aria-label="${escapeHtml(mix.title)}">
      <div class="mix-artwork ${playable ? 'has-player' : ''}">
        ${playable ? `
        <iframe class="mix-soundcloud" width="100%" height="100%" scrolling="no" frameborder="no"
                loading="lazy" allow="autoplay"
                title="Lecteur SoundCloud — ${escapeHtml(mix.title)}"
                src="${soundcloudEmbedSrc(mix.soundcloud_url)}"></iframe>
        ` : `
        <div class="mix-artwork-placeholder">
          <div class="vinyl-disc"><div class="vinyl-center"></div></div>
        </div>
        <button class="mix-play-btn" aria-label="Écouter ${escapeHtml(mix.title)}">
          <svg class="play-icon"  viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        `}
      </div>
      <div class="mix-info">
        <h3 class="mix-title">${escapeHtml(mix.title)}</h3>
        ${mix.genre
          ? `<span class="mix-genre ${genreColor(mix.genre)}">${escapeHtml(mix.genre)}</span>`
          : (playable ? '<span class="mix-genre mix-genre-live">SoundCloud</span>' : '')}
        ${(mix.duration || mix.year) ? `
        <div class="mix-meta">
          ${mix.duration ? `
          <span class="mix-duration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${escapeHtml(mix.duration)}
          </span>` : ''}
          ${mix.year ? `<span class="mix-date">${escapeHtml(mix.year)}</span>` : ''}
        </div>` : ''}
        ${!playable ? `
        <div class="mix-waveform" aria-hidden="true">
          ${randomWaveform(i)}
        </div>` : ''}
      </div>
    </article>`;
  }).join('');

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

/* ── Tarifs / Configurateur de soirée ──
   L'internaute choisit un type d'événement puis des options (éclairage, machine
   à fumée...) ; le total s'affiche en direct (ou "Sur devis" tant que les prix ne
   sont pas renseignés dans data.json), et la demande de devis part déjà pré-remplie. */
const FORMULA_ICONS = {
  wedding: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/></svg>',
  birthday: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>',
  corporate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  bar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
};
const OPTION_ICONS = {
  lighting:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.3 1 2.5h6c0-1.2.5-2 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  fog:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  photobooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  sound:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12.01" y2="6"/></svg>',
  hour:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  mc:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
};
const DEFAULT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/></svg>';

let configFormulas = [];
let configOptions  = [];
let selectedFormulaId  = null;
const selectedOptionIds = new Set();

function fmtEUR(n) {
  return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function renderPricingConfigurator(formulas, options) {
  configFormulas = formulas || [];
  configOptions  = options  || [];

  const grid = document.getElementById('pricing-grid');
  if (!grid) return;

  grid.innerHTML = configFormulas.map(f => `
    <button type="button" class="pricing-card formula-card reveal" data-formula="${f.id}" aria-pressed="false">
      <div class="pricing-icon">${FORMULA_ICONS[f.id] || DEFAULT_ICON}</div>
      <h3 class="pricing-name">${escapeHtml(f.name)}</h3>
      <p class="pricing-desc">${escapeHtml(f.description)}</p>
      <ul class="pricing-features">
        ${f.features.map(ft => `<li>${escapeHtml(ft)}</li>`).join('')}
      </ul>
      <div class="pricing-quote">${f.basePrice > 0 ? `à partir de ${fmtEUR(f.basePrice)}` : 'Sur devis'}</div>
      <span class="formula-check" aria-hidden="true">✓</span>
    </button>`).join('');

  const optionsGrid = document.getElementById('pricing-options');
  if (optionsGrid) {
    optionsGrid.innerHTML = configOptions.map(o => `
      <button type="button" class="option-card" data-option="${o.id}">
        <span class="option-thumb">
          ${o.photo ? `<img src="${escapeHtml(o.photo)}" alt="${escapeHtml(o.label)}" loading="lazy">` : (OPTION_ICONS[o.id] || DEFAULT_ICON)}
        </span>
        <span class="option-label">${escapeHtml(o.label)}</span>
        <span class="option-price">${o.price > 0 ? `+${fmtEUR(o.price)}` : 'Sur devis'}</span>
        <span class="option-selected-badge" aria-hidden="true">✓</span>
      </button>`).join('');
    optionsGrid.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => openOptionModal(card.dataset.option));
    });
  }

  grid.querySelectorAll('.formula-card').forEach(card => {
    card.addEventListener('click', () => selectFormula(card.dataset.formula));
  });
}

function selectFormula(id) {
  selectedFormulaId = id;
  document.querySelectorAll('.formula-card').forEach(card => {
    const active = card.dataset.formula === id;
    card.classList.toggle('selected', active);
    card.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('config-options-step').hidden = false;
  updateConfigSummary();
}

function updateConfigSummary() {
  const summary = document.getElementById('config-summary');
  const totalEl = document.getElementById('config-total');
  if (!summary || !selectedFormulaId) return;
  summary.hidden = false;

  const formula = configFormulas.find(f => f.id === selectedFormulaId);
  const chosenOptions = configOptions.filter(o => selectedOptionIds.has(o.id));
  const pricedTotal = (formula?.basePrice > 0 ? formula.basePrice : 0)
    + chosenOptions.reduce((sum, o) => sum + (o.price > 0 ? o.price : 0), 0);
  const hasUnpriced = !(formula?.basePrice > 0) || chosenOptions.some(o => !(o.price > 0));

  if (pricedTotal === 0) {
    totalEl.textContent = 'Sur devis';
  } else {
    totalEl.textContent = hasUnpriced ? `À partir de ${fmtEUR(pricedTotal)}` : fmtEUR(pricedTotal);
  }

  summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Modale de détail d'une option (photo, description, ajout à la sélection) ── */
function openOptionModal(id) {
  const option = configOptions.find(o => o.id === id);
  const modal  = document.getElementById('option-modal');
  if (!option || !modal) return;

  const photoEl   = document.getElementById('option-modal-photo');
  const titleEl   = document.getElementById('option-modal-title');
  const descEl    = document.getElementById('option-modal-desc');
  const priceEl   = document.getElementById('option-modal-price');
  const toggleBtn = document.getElementById('option-modal-toggle-btn');

  photoEl.innerHTML = option.photo
    ? `<img src="${escapeHtml(option.photo)}" alt="${escapeHtml(option.label)}">`
    : (OPTION_ICONS[option.id] || DEFAULT_ICON);
  titleEl.textContent = option.label;
  descEl.textContent  = option.description || '';
  priceEl.textContent = option.price > 0 ? `+${fmtEUR(option.price)}` : 'Sur devis';

  function syncToggleBtn() {
    const isSelected = selectedOptionIds.has(id);
    toggleBtn.textContent = isSelected ? '✓ Ajoutée — retirer de ma sélection' : '+ Ajouter à ma sélection';
    toggleBtn.classList.toggle('btn-outline', isSelected);
    toggleBtn.classList.toggle('btn-primary', !isSelected);
  }
  syncToggleBtn();

  toggleBtn.onclick = () => {
    selectedOptionIds.has(id) ? selectedOptionIds.delete(id) : selectedOptionIds.add(id);
    document.querySelector(`.option-card[data-option="${id}"]`)?.classList.toggle('selected', selectedOptionIds.has(id));
    syncToggleBtn();
    updateConfigSummary();
  };

  modal.hidden = false;
}

(function initOptionModal() {
  const modal    = document.getElementById('option-modal');
  const closeBtn = document.getElementById('option-modal-close');
  if (!modal) return;
  const close = () => { modal.hidden = true; };
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
})();

/* ── Guide par questions : recommande le type d'événement sans IA réelle ── */
const QUIZ_QUESTIONS = [
  {
    question: "Quelle est l'occasion ?",
    answers: [
      { label: 'Un mariage',                                     weights: { wedding: 3 } },
      { label: 'Un anniversaire',                                weights: { birthday: 3 } },
      { label: "Une soirée d'entreprise ou un séminaire",         weights: { corporate: 3 } },
      { label: 'Une soirée festive sans occasion particulière',   weights: { bar: 2, other: 1 } },
    ],
  },
  {
    question: 'Où se déroule la soirée ?',
    answers: [
      { label: 'Salle de réception ou à domicile', weights: { wedding: 1, birthday: 1, other: 1 } },
      { label: 'Bar, guinguette ou lieu public',   weights: { bar: 2 } },
      { label: 'Bureaux ou salle de conférence',   weights: { corporate: 2 } },
    ],
  },
  {
    question: 'Quelle ambiance recherchez-vous ?',
    answers: [
      { label: 'Chic et élégante',             weights: { wedding: 2 } },
      { label: 'Festive et conviviale',        weights: { bar: 1, birthday: 2 } },
      { label: 'Professionnelle et maîtrisée', weights: { corporate: 2 } },
    ],
  },
];

let quizIndex = 0;
const quizScores = { wedding: 0, birthday: 0, corporate: 0, bar: 0, other: 0 };

function renderQuizStep() {
  const card = document.getElementById('quiz-card');
  if (!card) return;
  const q = QUIZ_QUESTIONS[quizIndex];
  card.innerHTML = `
    <div class="quiz-progress">Question ${quizIndex + 1} / ${QUIZ_QUESTIONS.length}</div>
    <p class="quiz-question">${escapeHtml(q.question)}</p>
    <div class="quiz-answers">
      ${q.answers.map((a, i) => `<button type="button" class="quiz-answer-btn" data-index="${i}">${escapeHtml(a.label)}</button>`).join('')}
    </div>`;
  card.querySelectorAll('.quiz-answer-btn').forEach(btn => {
    btn.addEventListener('click', () => answerQuiz(q.answers[Number(btn.dataset.index)]));
  });
}

function answerQuiz(answer) {
  Object.entries(answer.weights).forEach(([id, w]) => { quizScores[id] = (quizScores[id] || 0) + w; });
  quizIndex++;
  quizIndex < QUIZ_QUESTIONS.length ? renderQuizStep() : finishQuiz();
}

function finishQuiz() {
  const bestId = Object.entries(quizScores).sort((a, b) => b[1] - a[1])[0][0];
  revealFormulaStep(bestId);
}

function revealFormulaStep(recommendedId) {
  document.getElementById('config-quiz-step').hidden = true;
  document.getElementById('config-formula-step').hidden = false;

  const resultEl = document.getElementById('quiz-result');
  if (recommendedId && resultEl) {
    const formula = configFormulas.find(f => f.id === recommendedId);
    if (formula) {
      resultEl.hidden = false;
      resultEl.innerHTML = `D'après vos réponses, on vous recommande la formule <strong>${escapeHtml(formula.name)}</strong> — vous pouvez bien sûr en choisir une autre ci-dessous. <button type="button" class="quiz-redo-btn" id="quiz-redo-btn">Refaire le questionnaire</button>`;
      document.getElementById('quiz-redo-btn')?.addEventListener('click', restartQuiz);
      selectFormula(recommendedId);
    }
  }
  document.getElementById('config-formula-step').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function restartQuiz() {
  quizIndex = 0;
  Object.keys(quizScores).forEach(k => { quizScores[k] = 0; });
  const resultEl = document.getElementById('quiz-result');
  if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ''; }
  document.getElementById('config-formula-step').hidden = true;
  document.getElementById('config-quiz-step').hidden = false;
  renderQuizStep();
}

(function initQuiz() {
  if (!document.getElementById('quiz-card')) return;
  renderQuizStep();
  document.getElementById('quiz-skip-btn')?.addEventListener('click', () => revealFormulaStep(null));
})();

/* ── Pré-remplissage de la demande de devis avec la configuration choisie ── */
(function initConfigCta() {
  const ctaBtn = document.getElementById('config-cta-btn');
  if (!ctaBtn) return;
  const MARKER_START = '— Configuration choisie sur le site —';
  const MARKER_END   = '— fin de la configuration —';

  ctaBtn.addEventListener('click', () => {
    if (!selectedFormulaId) return;
    const formula = configFormulas.find(f => f.id === selectedFormulaId);
    const select  = document.getElementById('event_type');
    const textarea = document.getElementById('message');
    if (!formula) return;

    if (select) {
      select.value = formula.id;
      select.dispatchEvent(new Event('change'));
    }

    if (textarea) {
      const chosenOptions = configOptions.filter(o => selectedOptionIds.has(o.id));
      const lines = [`Formule : ${formula.name}`];
      if (chosenOptions.length) lines.push(`Options : ${chosenOptions.map(o => o.label).join(', ')}`);
      const block = `${MARKER_START}\n${lines.join('\n')}\n${MARKER_END}`;

      const value   = textarea.value;
      const startIdx = value.indexOf(MARKER_START);
      const endIdx   = value.indexOf(MARKER_END);
      if (startIdx !== -1 && endIdx !== -1) {
        textarea.value = value.slice(0, startIdx) + block + value.slice(endIdx + MARKER_END.length);
      } else {
        textarea.value = block + (value.trim()
          ? '\n\n' + value
          : "\n\nDécris ici ton événement : lieu, nombre de personnes, horaires souhaités…");
      }
    }
  });
})();

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
      renderPricingConfigurator(data.pricing || [], data.pricingOptions || []);
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
