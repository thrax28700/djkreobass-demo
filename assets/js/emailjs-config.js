/*
  Configuration EmailJS — DJ KREOBASS
  ─────────────────────────────────────
  Permet à l'espace admin d'envoyer automatiquement les devis et factures
  par email au client, sans backend (tout se passe dans le navigateur).

  1. Créer un compte gratuit sur https://www.emailjs.com (plan gratuit :
     200 emails/mois, largement suffisant).
  2. "Email Services" → Add New Service → connecter la boîte
     deejaykreobass@gmail.com (Gmail) → copier le "Service ID".
  3. "Email Templates" → créer un template "Devis" (variables utilisées :
     to_email, to_name, quote_number, quote_type, event_label, total,
     valid_until, view_link, message) → copier le "Template ID".
  4. Dupliquer ce template pour "Facture" (mêmes variables) → copier son ID.
  5. "Account" → "General" → copier la "Public Key".
  6. Remplacer les valeurs ci-dessous.

  Comme pour Firebase, ces clés sont prévues pour être visibles côté client.
*/
window.EMAILJS_CONFIG = {
  publicKey:          "REMPLACER_publicKey",
  serviceId:           "REMPLACER_serviceId",
  templateIdDevis:      "REMPLACER_templateIdDevis",
  templateIdFacture:    "REMPLACER_templateIdFacture",
};

/* Devient true automatiquement une fois les valeurs ci-dessus renseignées */
window.EMAILJS_READY = !Object.values(window.EMAILJS_CONFIG).some(v => v.startsWith('REMPLACER_'));
