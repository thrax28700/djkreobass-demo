window.EMAILJS_CONFIG = {
  publicKey:          "REMPLACER_publicKey",
  serviceId:           "REMPLACER_serviceId",
  templateIdDevis:      "REMPLACER_templateIdDevis",
  templateIdFacture:    "REMPLACER_templateIdFacture",
};

window.EMAILJS_READY = !Object.values(window.EMAILJS_CONFIG).some(v => v.startsWith('REMPLACER_'));
