window.FIREBASE_CONFIG = {
  apiKey: "REMPLACER_apiKey",
  authDomain: "REMPLACER_authDomain",
  projectId: "REMPLACER_projectId",
  storageBucket: "REMPLACER_storageBucket",
  messagingSenderId: "REMPLACER_messagingSenderId",
  appId: "REMPLACER_appId",
};

window.FIREBASE_READY = !Object.values(window.FIREBASE_CONFIG).some(v => v.startsWith('REMPLACER_'));
