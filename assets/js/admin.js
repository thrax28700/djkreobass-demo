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

document.getElementById('emailjs-warning').hidden  = !!window.EMAILJS_READY;
document.getElementById('business-warning').hidden = !!window.BUSINESS_INFO_READY;
if (window.EMAILJS_READY && window.emailjs) {
  window.emailjs.init({ publicKey: window.EMAILJS_CONFIG.publicKey });
}

function runAdmin() {
  const app  = initializeApp(window.FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  let bookings = [];
  let activeFilter = 'pending';
  let quotes = [];
  let activeQuoteFilter = 'all';

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-bookings').hidden = tab.dataset.tab !== 'bookings';
      document.getElementById('tab-quotes').hidden   = tab.dataset.tab !== 'quotes';
    });
  });

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
      listenQuotes();
    } else {
      loginView.hidden = false;
      dashboardView.hidden = true;
      logoutBtn.hidden = true;
    }
  });

  function listenBookings() {
    onSnapshot(collection(db, 'bookings'), snap => {
      bookings = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      renderStats();
      renderList();
      populateBookingSelect();
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

  document.querySelectorAll('#tab-bookings .admin-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-bookings .admin-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList();
    });
  });

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

  function quoteNumber(prefix) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${prefix}-${stamp}`;
  }

  function computeTotal(items) {
    return (items || []).reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  }

  function fmtEUR(n) {
    return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  function quoteViewLink(id) {
    return new URL(`devis.html?id=${id}`, window.location.href).href;
  }

  async function sendQuoteEmail(quote, id) {
    if (!window.EMAILJS_READY || !window.emailjs) return { sent: false, reason: 'not-configured' };
    const isFacture = quote.type === 'facture';
    const templateId = isFacture ? window.EMAILJS_CONFIG.templateIdFacture : window.EMAILJS_CONFIG.templateIdDevis;
    try {
      await window.emailjs.send(window.EMAILJS_CONFIG.serviceId, templateId, {
        to_email: quote.client.email,
        to_name: quote.client.name,
        quote_number: quote.number,
        quote_type: isFacture ? 'Facture' : 'Devis',
        event_label: EVENT_LABELS[quote.event?.type] || quote.event?.type || '',
        total: fmtEUR(quote.total),
        valid_until: quote.validUntil || '',
        view_link: quoteViewLink(id),
        message: quote.notes || '',
      });
      return { sent: true };
    } catch (err) {
      console.error('Erreur EmailJS :', err);
      return { sent: false, reason: err?.text || err?.message || 'erreur inconnue' };
    }
  }

  function listenQuotes() {
    onSnapshot(collection(db, 'quotes'), snap => {
      quotes = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.number || '').localeCompare(a.number || ''));
      renderQuotesList();
    }, err => console.error('Erreur de synchronisation des devis :', err));
  }

  function quoteStatusLabel(q) {
    return {
      sent:     q.type === 'facture' ? 'Envoyée' : 'Envoyé',
      accepted: 'Accepté',
      declined: 'Refusé',
      invoiced: 'Facturé',
      paid:     'Payée',
    }[q.status] || q.status;
  }

  function renderQuotesList() {
    const list  = document.getElementById('quotes-list');
    const empty = document.getElementById('quotes-empty');
    const filtered = activeQuoteFilter === 'all' ? quotes : quotes.filter(q => q.status === activeQuoteFilter);

    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.innerHTML = filtered.map(q => {
      const isFacture = q.type === 'facture';
      const eventLabel = [
        EVENT_LABELS[q.event?.type] || q.event?.type,
        q.event?.date || '',
      ].filter(Boolean).join(' · ');

      const actions = [];
      actions.push(`<button class="btn btn-sm btn-outline" data-action="download" data-id="${q.id}">Télécharger PDF</button>`);
      if (q.status === 'sent') {
        actions.push(`<button class="btn btn-sm btn-outline" data-action="resend" data-id="${q.id}">Renvoyer l'email</button>`);
      }
      if (!isFacture && q.status === 'accepted') {
        actions.push(`<button class="btn btn-sm btn-primary" data-action="invoice" data-id="${q.id}">Générer la facture</button>`);
      }
      if (isFacture && q.status === 'sent') {
        actions.push(`<button class="btn btn-sm btn-primary" data-action="mark-paid" data-id="${q.id}">Marquer payée</button>`);
      }
      actions.push(`<button class="btn btn-sm btn-outline admin-delete" data-action="delete-quote" data-id="${q.id}">Supprimer</button>`);

      return `
      <article class="admin-booking status-${escapeHtml(q.status)}">
        <div class="admin-booking-main">
          <div class="admin-booking-date">${escapeHtml(q.number || '—')}</div>
          <div class="admin-booking-info">
            <h3>${isFacture ? 'Facture' : 'Devis'} — ${escapeHtml(q.client?.name || 'Sans nom')}</h3>
            <p class="admin-booking-meta">${escapeHtml(eventLabel || 'Événement non précisé')}</p>
            ${q.client?.email ? `<p class="admin-booking-contact">✉ ${escapeHtml(q.client.email)}</p>` : ''}
            <p class="admin-quote-total">${fmtEUR(q.total)}</p>
            <a class="admin-quote-link" href="${quoteViewLink(q.id)}" target="_blank" rel="noopener">${quoteViewLink(q.id)}</a>
          </div>
          <span class="admin-status-badge status-${escapeHtml(q.status)}">${quoteStatusLabel(q)}</span>
        </div>
        <div class="admin-booking-actions">${actions.join('')}</div>
      </article>`;
    }).join('');

    list.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleQuoteAction(btn.dataset.action, btn.dataset.id, btn));
    });
  }

  async function handleQuoteAction(action, id, btn) {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    try {
      if (action === 'download') {
        if (window.generateQuotePDF) window.generateQuotePDF(quote);

      } else if (action === 'resend') {
        btn.disabled = true;
        const result = await sendQuoteEmail(quote, id);
        alert(result.sent
          ? 'Email renvoyé au client.'
          : `Email non envoyé (${result.reason === 'not-configured' ? 'EmailJS non configuré' : result.reason}).\nLien à envoyer manuellement :\n${quoteViewLink(id)}`);

      } else if (action === 'mark-paid') {
        await updateDoc(doc(db, 'quotes', id), { status: 'paid', paidAt: serverTimestamp() });

      } else if (action === 'invoice') {
        btn.disabled = true;
        const factureId = doc(collection(db, 'quotes')).id;
        const facture = {
          type: 'facture',
          number: quoteNumber('FAC'),
          status: 'sent',
          bookingId: quote.bookingId || null,
          linkedQuoteId: id,
          client: quote.client,
          event: quote.event,
          items: quote.items,
          notes: quote.notes || '',
          total: quote.total,
          issueDate: new Date().toISOString().slice(0, 10),
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'quotes', factureId), facture);
        await updateDoc(doc(db, 'quotes', id), { status: 'invoiced' });
        const result = await sendQuoteEmail(facture, factureId);
        alert(result.sent
          ? 'Facture générée et envoyée au client.'
          : `Facture générée mais email non envoyé (${result.reason === 'not-configured' ? 'EmailJS non configuré' : result.reason}).\nLien à envoyer manuellement :\n${quoteViewLink(factureId)}`);

      } else if (action === 'delete-quote') {
        if (!confirm('Supprimer définitivement ce document ?')) return;
        await deleteDoc(doc(db, 'quotes', id));
      }
    } catch (err) {
      alert('Une erreur est survenue : ' + err.message);
      console.error(err);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  document.querySelectorAll('#tab-quotes .admin-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-quotes .admin-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeQuoteFilter = btn.dataset.qfilter;
      renderQuotesList();
    });
  });

  const quoteModal      = document.getElementById('add-quote-modal');
  const addQuoteBtn      = document.getElementById('add-quote-btn');
  const cancelQuoteBtn    = document.getElementById('cancel-quote-btn');
  const quoteForm          = document.getElementById('add-quote-form');
  const quoteError          = document.getElementById('add-quote-error');
  const qBookingSelect        = document.getElementById('q-booking');
  const qItemsWrap              = document.getElementById('q-items');
  const qTotalPreview            = document.getElementById('q-total-preview');

  function populateBookingSelect() {
    if (!qBookingSelect) return;
    const current = qBookingSelect.value;
    qBookingSelect.innerHTML = '<option value="">— Aucune —</option>' + bookings.map(b => {
      const [y, m, d] = (b.date || '').split('-');
      const dateLabel = (y && m && d) ? `${d}/${m}/${y}` : (b.date || '');
      return `<option value="${b.id}">${dateLabel} — ${escapeHtml(b.name || 'Sans nom')}</option>`;
    }).join('');
    qBookingSelect.value = current;
  }

  function addItemRow(label = '', qty = 1, unitPrice = '') {
    const row = document.createElement('div');
    row.className = 'q-item-row';
    row.innerHTML = `
      <input type="text" placeholder="Prestation (ex : Animation soirée 5h)" class="q-item-label" value="${escapeHtml(label)}">
      <input type="number" min="1" step="1" class="q-item-qty" value="${qty}">
      <input type="number" min="0" step="0.01" placeholder="Prix (€)" class="q-item-price" value="${unitPrice}">
      <button type="button" class="q-item-remove" aria-label="Supprimer cette ligne">✕</button>
    `;
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateTotalPreview));
    row.querySelector('.q-item-remove').addEventListener('click', () => { row.remove(); updateTotalPreview(); });
    qItemsWrap.appendChild(row);
  }

  function collectItems() {
    return Array.from(qItemsWrap.querySelectorAll('.q-item-row')).map(row => ({
      label: row.querySelector('.q-item-label').value.trim(),
      qty: Number(row.querySelector('.q-item-qty').value) || 1,
      unitPrice: Number(row.querySelector('.q-item-price').value) || 0,
    })).filter(it => it.label);
  }

  function updateTotalPreview() {
    qTotalPreview.textContent = fmtEUR(computeTotal(collectItems()));
  }

  document.getElementById('q-add-item-btn').addEventListener('click', () => addItemRow());

  qBookingSelect.addEventListener('change', () => {
    const b = bookings.find(x => x.id === qBookingSelect.value);
    if (!b) return;
    document.getElementById('q-name').value = b.name || '';
    document.getElementById('q-email').value = b.email || '';
    document.getElementById('q-phone').value = b.phone || '';
    document.getElementById('q-event-type').value = b.eventType || 'other';
    document.getElementById('q-date').value = b.date || '';
    document.getElementById('q-venue').value = b.venueName || '';
  });

  function resetQuoteForm() {
    quoteForm.reset();
    qItemsWrap.innerHTML = '';
    addItemRow();
    updateTotalPreview();
  }

  addQuoteBtn.addEventListener('click', () => {
    populateBookingSelect();
    resetQuoteForm();
    quoteModal.hidden = false;
  });
  cancelQuoteBtn.addEventListener('click', () => { quoteModal.hidden = true; });
  quoteModal.addEventListener('click', e => { if (e.target === quoteModal) quoteModal.hidden = true; });

  quoteForm.addEventListener('submit', async e => {
    e.preventDefault();
    quoteError.hidden = true;

    const name  = document.getElementById('q-name').value.trim();
    const email = document.getElementById('q-email').value.trim();
    const items = collectItems();

    if (!name || !email) {
      quoteError.textContent = 'Nom et email du client sont requis.';
      quoteError.hidden = false;
      return;
    }
    if (items.length === 0) {
      quoteError.textContent = 'Ajoute au moins une prestation avec un prix.';
      quoteError.hidden = false;
      return;
    }

    const submitBtn = document.getElementById('submit-quote-btn');
    submitBtn.disabled = true;
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (window.BUSINESS_INFO?.quoteValidityDays || 30));

      const id = doc(collection(db, 'quotes')).id;
      const quote = {
        type: 'devis',
        number: quoteNumber('DEV'),
        status: 'sent',
        bookingId: qBookingSelect.value || null,
        linkedQuoteId: null,
        client: {
          name,
          email,
          phone: document.getElementById('q-phone').value.trim(),
        },
        event: {
          type: document.getElementById('q-event-type').value,
          date: document.getElementById('q-date').value,
          venue: document.getElementById('q-venue').value.trim(),
        },
        items,
        notes: document.getElementById('q-notes').value.trim(),
        total: computeTotal(items),
        issueDate: new Date().toISOString().slice(0, 10),
        validUntil: validUntil.toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        respondedAt: null,
      };

      await setDoc(doc(db, 'quotes', id), quote);
      const result = await sendQuoteEmail(quote, id);

      quoteModal.hidden = true;
      alert(result.sent
        ? `Devis ${quote.number} enregistré et envoyé à ${email}.`
        : `Devis ${quote.number} enregistré, mais l'email n'a pas pu être envoyé (${result.reason === 'not-configured' ? 'EmailJS non configuré' : result.reason}).\nLien à envoyer manuellement :\n${quoteViewLink(id)}`);
    } catch (err) {
      quoteError.textContent = 'Erreur : ' + err.message;
      quoteError.hidden = false;
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
