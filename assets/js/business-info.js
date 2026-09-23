/*
  Informations légales — DJ KREOBASS
  ─────────────────────────────────────
  Utilisées pour générer les PDF de devis/factures et la page publique
  d'acceptation (devis.html). Obligatoires sur une facture française.

  Remplace les valeurs ci-dessous par tes vraies informations (auto-entreprise
  ou société). Tant que le SIRET n'est pas renseigné, l'espace admin affiche
  un avertissement pour éviter d'envoyer une facture non conforme.
*/
window.BUSINESS_INFO = {
  displayName: "DJ KREOBASS",
  legalName:   "REMPLACER_nom_prenom_ou_raison_sociale",
  address:     "REMPLACER_adresse_complete",
  siret:       "REMPLACER_SIRET",
  /* Mention TVA usuelle en micro-entreprise : "TVA non applicable, art. 293 B du CGI".
     À adapter si tu n'es pas en franchise en base de TVA. */
  vatMention:  "REMPLACER_mention_TVA",
  iban:        "REMPLACER_IBAN",
  bic:         "REMPLACER_BIC",
  phone:       "+33 6 66 35 90 65",
  email:       "deejaykreobass@gmail.com",
  quoteValidityDays: 30,
};

window.BUSINESS_INFO_READY = !Object.values(window.BUSINESS_INFO).some(v => typeof v === 'string' && v.startsWith('REMPLACER_'));
