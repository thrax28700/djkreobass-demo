window.BUSINESS_INFO = {
  displayName: "DJ KREOBASS",
  legalName:   "REMPLACER_nom_prenom_ou_raison_sociale",
  address:     "REMPLACER_adresse_complete",
  siret:       "REMPLACER_SIRET",
  vatMention:  "REMPLACER_mention_TVA",
  iban:        "REMPLACER_IBAN",
  bic:         "REMPLACER_BIC",
  phone:       "+33 6 66 35 90 65",
  email:       "deejaykreobass@gmail.com",
  quoteValidityDays: 30,
};

window.BUSINESS_INFO_READY = !Object.values(window.BUSINESS_INFO).some(v => typeof v === 'string' && v.startsWith('REMPLACER_'));
