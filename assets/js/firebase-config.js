/*
  Configuration Firebase — DJ KREOBASS
  ─────────────────────────────────────
  Remplace les valeurs ci-dessous par celles de TON projet Firebase :
  Console Firebase → Paramètres du projet → Général → "Vos applications" → app Web → Config SDK.

  Ces clés ne sont PAS secrètes : elles sont faites pour être visibles côté client.
  La sécurité réelle est assurée par les règles Firestore (firestore.rules).
*/
window.FIREBASE_CONFIG = {
  apiKey: "REMPLACER_apiKey",
  authDomain: "REMPLACER_authDomain",
  projectId: "REMPLACER_projectId",
  storageBucket: "REMPLACER_storageBucket",
  messagingSenderId: "REMPLACER_messagingSenderId",
  appId: "REMPLACER_appId",
};

/* Devient true automatiquement une fois les valeurs ci-dessus renseignées */
window.FIREBASE_READY = !Object.values(window.FIREBASE_CONFIG).some(v => v.startsWith('REMPLACER_'));
