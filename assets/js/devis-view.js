import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const EVENT_LABELS = {
  wedding: 'Mariage',
  birthday: 'Anniversaire',
  corporate: 'Séminaire / Entreprise',
  bar: 'Soirée Bar / Guinguette',
  other: 'Autre',
};

const loadingEl = document.getElementById('devis-loading');
const errorEl   = document.getElementById('devis-error');
const cardEl    = document.getElementById('devis-card');

function fmtEUR(n) {
  return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const params = new URLSearchParams(window.location.search);
const quoteId = params.get('id');

if (!quoteId || !window.FIREBASE_READY) {
  showError();
} else {
  init();
}

async function init() {
  try {
    const app = initializeApp(window.FIREBASE_CONFIG);
    const db  = getFirestore(app);
    const ref = doc(db, 'quotes', quoteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) { showError(); return; }
    render(db, ref, { id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    showError();
  }
}

function showError() {
  loadingEl.hidden = true;
  errorEl.hidden = false;
}

function statusLabel(quote) {
  return {
    sent:     quote.type === 'facture' ? 'Facture envoyée' : 'En attente de votre réponse',
    accepted: 'Accepté',
    declined: 'Refusé',
    invoiced: 'Facturé',
    paid:     'Payée',
  }[quote.status] || quote.status;
}

function render(db, ref, quote) {
  loadingEl.hidden = true;
  cardEl.hidden = false;

  const isFacture = quote.type === 'facture';
  document.title = `DJ KREOBASS | ${isFacture ? 'Facture' : 'Devis'} ${quote.number || ''}`;

  document.getElementById('devis-doc-type').textContent = isFacture ? 'FACTURE' : 'DEVIS';
  document.getElementById('devis-number').textContent = quote.number || '—';
  document.getElementById('devis-date').textContent = fmtDate(quote.issueDate);
  document.getElementById('devis-client').textContent = quote.client?.name || '—';
  document.getElementById('devis-event').textContent = [
    EVENT_LABELS[quote.event?.type] || quote.event?.type,
    quote.event?.date ? `le ${fmtDate(quote.event.date)}` : '',
    quote.event?.venue,
  ].filter(Boolean).join(' · ') || '—';

  const badge = document.getElementById('devis-status-badge');
  badge.textContent = statusLabel(quote);
  badge.className = `devis-status-badge status-${quote.status}`;

  const tbody = document.getElementById('devis-items-body');
  tbody.innerHTML = (quote.items || []).map(it => `
    <tr>
      <td>${escapeHtml(it.label)}</td>
      <td>${escapeHtml(String(it.qty ?? 1))}</td>
      <td>${fmtEUR(it.unitPrice)}</td>
      <td>${fmtEUR((Number(it.qty) || 1) * (Number(it.unitPrice) || 0))}</td>
    </tr>`).join('');

  document.getElementById('devis-total').textContent = fmtEUR(quote.total);

  const notesEl = document.getElementById('devis-notes');
  if (quote.notes) { notesEl.textContent = quote.notes; notesEl.hidden = false; }

  const validityEl = document.getElementById('devis-validity');
  if (!isFacture && quote.validUntil) {
    validityEl.textContent = `Devis valable jusqu'au ${fmtDate(quote.validUntil)}.`;
    validityEl.hidden = false;
  }

  document.getElementById('devis-download-btn').addEventListener('click', () => {
    if (window.generateQuotePDF) window.generateQuotePDF(quote);
  });

  const acceptActions = document.getElementById('devis-accept-actions');
  const responseMsg   = document.getElementById('devis-response-msg');

  if (!isFacture && quote.status === 'sent') {
    acceptActions.hidden = false;
    document.getElementById('devis-accept-btn').addEventListener('click', () => respond(ref, quote, 'accepted', responseMsg, acceptActions, badge));
    document.getElementById('devis-decline-btn').addEventListener('click', () => {
      if (confirm('Confirmer le refus de ce devis ?')) respond(ref, quote, 'declined', responseMsg, acceptActions, badge);
    });
  } else if (!isFacture && (quote.status === 'accepted' || quote.status === 'declined')) {
    responseMsg.textContent = quote.status === 'accepted'
      ? 'Vous avez accepté ce devis. DJ KREOBASS revient vers vous pour finaliser votre événement.'
      : 'Vous avez refusé ce devis.';
    responseMsg.hidden = false;
  }
}

async function respond(ref, quote, status, responseMsg, acceptActions, badge) {
  acceptActions.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    await updateDoc(ref, { status, respondedAt: serverTimestamp() });
    acceptActions.hidden = true;
    badge.textContent = status === 'accepted' ? 'Accepté' : 'Refusé';
    badge.className = `devis-status-badge status-${status}`;
    responseMsg.textContent = status === 'accepted'
      ? 'Merci ! Votre devis est accepté — DJ KREOBASS revient vers vous pour finaliser votre événement.'
      : 'Votre réponse a bien été enregistrée.';
    responseMsg.hidden = false;
  } catch (err) {
    console.error(err);
    alert('Une erreur est survenue, réessaie ou contacte-nous directement.');
    acceptActions.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}
