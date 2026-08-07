/* DJ KREOBASS — Calendrier de réservation public (Firebase Firestore) */
import {
  initializeApp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, onSnapshot,
  runTransaction, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const MONTHS_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_ABBR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
const DAYS_FR      = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const EVENT_LABELS = {
  wedding: 'Mariage', birthday: 'Anniversaire', corporate: 'Séminaire / Entreprise',
  bar: 'Soirée Bar / Guinguette', other: 'Autre',
};

let db = null;
let availability = {};      // { 'YYYY-MM-DD': { status, eventType } }
let viewDate = new Date();  // mois actuellement affiché
let selectedDate = null;

function pad(n) { return String(n).padStart(2, '0'); }
function toDateId(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isPast(d) {
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today;
}

function renderCalendarShell() {
  const el = document.getElementById('booking-calendar');
  if (!el) return;

  if (!window.FIREBASE_READY) {
    el.innerHTML = `
      <div class="cal-unavailable">
        Le calendrier de réservation en ligne est en cours de configuration.
        Indique-nous ta date souhaitée directement dans le message ci-dessous.
      </div>`;
    const dateGroup = document.getElementById('event_date_group');
    if (dateGroup) dateGroup.hidden = false;
    return;
  }

  el.innerHTML = `
    <div class="cal-header">
      <button type="button" class="cal-nav" id="cal-prev" aria-label="Mois précédent">‹</button>
      <span class="cal-title" id="cal-title"></span>
      <button type="button" class="cal-nav" id="cal-next" aria-label="Mois suivant">›</button>
    </div>
    <div class="cal-weekdays">${DAYS_FR.map(d => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid" id="cal-grid"></div>
    <div class="cal-legend">
      <span><i class="cal-dot available"></i> Disponible</span>
      <span><i class="cal-dot pending"></i> En attente</span>
      <span><i class="cal-dot confirmed"></i> Réservé</span>
    </div>
    <p class="cal-selected" id="cal-selected">Sélectionne une date ci-dessus.</p>
  `;

  document.getElementById('cal-prev').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderMonth();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderMonth();
  });

  renderMonth();
}

function renderMonth() {
  const grid  = document.getElementById('cal-grid');
  const title = document.getElementById('cal-title');
  if (!grid || !title) return;

  title.textContent = `${MONTHS_FR[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < startOffset; i++) html += '<span class="cal-day empty"></span>';

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const id = toDateId(d);
    const entry = availability[id];
    const past = isPast(d);
    let cls = 'available';
    if (entry?.status === 'confirmed') cls = 'confirmed';
    else if (entry?.status === 'pending') cls = 'pending';
    if (past) cls = 'past';
    if (selectedDate === id && cls === 'available') cls += ' selected';

    const disabled = (cls.includes('past') || cls.includes('confirmed')) ? 'disabled' : '';
    html += `<button type="button" class="cal-day ${cls}" data-date="${id}" ${disabled}>${day}</button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.empty):not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDate = btn.dataset.date;
      const dateInput = document.getElementById('event_date');
      if (dateInput) dateInput.value = selectedDate;
      const summary = document.getElementById('cal-selected');
      if (summary) {
        const [y, m, dd] = selectedDate.split('-');
        summary.innerHTML = `Date sélectionnée : <strong>${dd}/${m}/${y}</strong>`;
      }
      renderMonth();
    });
  });
}

/* Convertit une entrée du calendrier public en item d'agenda ("À venir" / "Passés").
   Les soirées privées (mariage, anniversaire, séminaire) restent anonymes : ni nom
   du client, ni lieu — seules les soirées publiques (bar/guinguette) affichent le lieu. */
function calendarEntryToAgendaEvent(dateId, entry) {
  const [y, m, d] = dateId.split('-').map(Number);
  const isPublic = entry.eventType === 'bar';
  return {
    date: `${pad(d)} ${MONTHS_ABBR[m - 1]} ${y}`,
    venue: isPublic ? (entry.venueName || EVENT_LABELS.bar) : 'Soirée privée',
    city: isPublic ? 'Centre-Val de Loire' : '',
    time: '',
    status: dateId >= toDateId(new Date()) ? 'upcoming' : 'past',
    bookable: false,
  };
}

function initFirestoreListener() {
  if (!window.FIREBASE_READY) return;
  try {
    const app = initializeApp(window.FIREBASE_CONFIG);
    db = getFirestore(app);
    onSnapshot(collection(db, 'calendar'), snap => {
      availability = {};
      const confirmedEvents = [];
      snap.forEach(d => {
        availability[d.id] = d.data();
        if (d.data().status === 'confirmed') {
          confirmedEvents.push(calendarEntryToAgendaEvent(d.id, d.data()));
        }
      });
      renderMonth();
      window.dispatchEvent(new CustomEvent('kb:confirmed-events', { detail: confirmedEvents }));
    }, err => console.error('Erreur de synchronisation du calendrier :', err));
  } catch (err) {
    console.error('Erreur d’initialisation Firebase :', err);
  }
}

/* API utilisée par script.js lors de l'envoi du formulaire */
window.Booking = {
  getSelectedDate: () => selectedDate,

  async createBooking({ name, email, phone, eventType, date, message, venueName }) {
    if (!window.FIREBASE_READY) {
      throw new Error('not-configured');
    }
    if (!date) {
      throw new Error('no-date-selected');
    }
    if (!db) db = getFirestore(initializeApp(window.FIREBASE_CONFIG));

    const calendarRef = doc(db, 'calendar', date);
    const bookingRef   = doc(collection(db, 'bookings'));
    const isPublicVenue = eventType === 'bar' && venueName;

    await runTransaction(db, async (tx) => {
      const existing = await tx.get(calendarRef);
      if (existing.exists()) {
        throw new Error('date-taken');
      }
      tx.set(calendarRef, {
        date, eventType, status: 'pending',
        ...(isPublicVenue ? { venueName } : {}),
      });
      tx.set(bookingRef, {
        name, email, phone: phone || '', eventType, date, message,
        venueName: venueName || '',
        status: 'pending',
        source: 'site',
        createdAt: serverTimestamp(),
      });
    });

    selectedDate = null;
    return true;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  renderCalendarShell();
  initFirestoreListener();
});
