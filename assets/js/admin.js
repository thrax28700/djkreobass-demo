/* DJ KREOBASS — Espace Admin (Firebase Auth + Firestore temps réel) */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, updateDoc, deleteDoc, setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const EVENT_LABELS = {
  wedding: 'Mariage',
  birthday: 'Anniversaire',
  corporate: 'Séminaire / Entreprise',
  bar: 'Soirée Bar / Guinguette',
  other: 'Autre',
};

const loginView     = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const logoutBtn     = document.getElementById('logout-btn');
const warning        = document.getElementById('firebase-warning');

if (!window.FIREBASE_READY) {
  warning.hidden = false;
} else {
  runAdmin();
}

function runAdmin() {
  const app  = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  let bookings = [];
  let activeFilter = 'pending';

  /* ── Connexion ── */
  const loginForm  = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.hidden = true;
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = 'Connexion impossible : email ou mot de passe incorrect.';
      loginError.hidden = false;
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, user => {
    if (user) {
      loginView.hidden = true;
      dashboardView.hidden = false;
      logoutBtn.hidden = false;
      listenBookings();
    } else {
      loginView.hidden = false;
      dashboardView.hidden = true;
      logoutBtn.hidden = true;
    }
  });

  /* ── Écoute temps réel des réservations ── */
  function listenBookings() {
    onSnapshot(collection(db, 'bookings'), snap => {
      bookings = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      renderStats();
      renderList();
    }, err => console.error('Erreur de synchronisation :', err));
  }

  function renderStats() {
    document.getElementById('stat-pending').textContent   = bookings.filter(b => b.status === 'pending').length;
    document.getElementById('stat-confirmed').textContent = bookings.filter(b => b.status === 'confirmed').length;
    document.getElementById('stat-declined').textContent  = bookings.filter(b => b.status === 'declined').length;
  }

  function renderList() {
    const list  = document.getElementById('bookings-list');
    const empty = document.getElementById('bookings-empty');
    const filtered = activeFilter === 'all' ? bookings : bookings.filter(b => b.status === activeFilter);

    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.innerHTML = filtered.map(b => {
      const [y, m, d] = (b.date || '').split('-');
      const dateLabel = (y && m && d) ? `${d}/${m}/${y}` : (b.date || '—');
      return `
      <article class="admin-booking status-${escapeHtml(b.status)}">
        <div class="admin-booking-main">
          <div class="admin-booking-date">${dateLabel}</div>
          <div class="admin-booking-info">
            <h3>${escapeHtml(b.name || 'Sans nom')}</h3>
            <p class="admin-booking-meta">
              ${escapeHtml(EVENT_LABELS[b.eventType] || b.eventType || 'Non précisé')}
              ${b.venueName ? ` · ${escapeHtml(b.venueName)}` : ''}
              ${b.source === 'manual' ? ' · ajout manuel' : ''}
            </p>
            ${b.email ? `<p class="admin-booking-contact">✉ ${escapeHtml(b.email)}</p>` : ''}
            ${b.message ? `<p class="admin-booking-message">${escapeHtml(b.message)}</p>` : ''}
          </div>
          <span class="admin-status-badge">${statusLabel(b.status)}</span>
        </div>
        <div class="admin-booking-actions">
          ${b.status !== 'confirmed' ? `<button class="btn btn-sm btn-primary" data-action="confirm" data-id="${b.id}">Confirmer</button>` : ''}
          ${b.status !== 'declined'  ? `<button class="btn btn-sm btn-outline" data-action="decline" data-id="${b.id}">Refuser</button>` : ''}
          <button class="btn btn-sm btn-outline admin-delete" data-action="delete" data-id="${b.id}">Supprimer</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
    });
  }

  function statusLabel(status) {
    return { pending: 'En attente', confirmed: 'Confirmée', declined: 'Refusée' }[status] || status;
  }

  async function handleAction(action, id) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    try {
      if (action === 'confirm') {
        await updateDoc(doc(db, 'bookings', id), { status: 'confirmed' });
        if (booking.date) {
          const isPublicVenue = booking.eventType === 'bar' && booking.venueName;
          await setDoc(doc(db, 'calendar', booking.date), {
            date: booking.date, eventType: booking.eventType || 'other', status: 'confirmed',
            ...(isPublicVenue ? { venueName: booking.venueName } : {}),
          });
        }
      } else if (action === 'decline') {
        await updateDoc(doc(db, 'bookings', id), { status: 'declined' });
        if (booking.date) {
          await deleteDoc(doc(db, 'calendar', booking.date)).catch(() => {});
        }
      } else if (action === 'delete') {
        if (!confirm('Supprimer définitivement cette réservation ?')) return;
        await deleteDoc(doc(db, 'bookings', id));
        if (booking.date && booking.status !== 'declined') {
          await deleteDoc(doc(db, 'calendar', booking.date)).catch(() => {});
        }
      }
    } catch (err) {
      alert('Une erreur est survenue : ' + err.message);
      console.error(err);
    }
  }

  /* ── Filtres ── */
  document.querySelectorAll('.admin-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList();
    });
  });

  /* ── Modale : réservation manuelle ── */
  const modal        = document.getElementById('add-booking-modal');
  const addBtn        = document.getElementById('add-booking-btn');
  const cancelBtn      = document.getElementById('cancel-booking-btn');
  const addForm        = document.getElementById('add-booking-form');
  const addError        = document.getElementById('add-booking-error');

  addBtn.addEventListener('click', () => { modal.hidden = false; });
  cancelBtn.addEventListener('click', () => { modal.hidden = true; addForm.reset(); addError.hidden = true; });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.hidden = true; } });

  const mbEventType  = document.getElementById('mb-event-type');
  const mbVenueGroup = document.getElementById('mb-venue-group');
  const syncVenueField = () => { mbVenueGroup.hidden = mbEventType.value !== 'bar'; };
  mbEventType.addEventListener('change', syncVenueField);
  syncVenueField();

  addForm.addEventListener('submit', async e => {
    e.preventDefault();
    addError.hidden = true;
    const name      = document.getElementById('mb-name').value.trim();
    const eventType = mbEventType.value;
    const date      = document.getElementById('mb-date').value;
    const note      = document.getElementById('mb-note').value.trim();
    const venueName = eventType === 'bar' ? document.getElementById('mb-venue').value.trim() : '';

    if (!name || !date) {
      addError.textContent = 'Nom et date sont requis.';
      addError.hidden = false;
      return;
    }

    const btn = addForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const isPublicVenue = eventType === 'bar' && venueName;
      await setDoc(doc(collection(db, 'bookings')), {
        name, eventType, date, message: note, email: '', phone: '', venueName,
        status: 'confirmed', source: 'manual', createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'calendar', date), {
        date, eventType, status: 'confirmed',
        ...(isPublicVenue ? { venueName } : {}),
      });
      modal.hidden = true;
      addForm.reset();
      syncVenueField();
    } catch (err) {
      addError.textContent = 'Erreur : ' + err.message;
      addError.hidden = false;
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
