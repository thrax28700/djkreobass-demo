# DJ KREOBASS — Site vitrine (démo)

Site vitrine statique pour DJ KREOBASS, animateur & platiniste professionnel en Centre-Val de Loire (Chartres, Eure-et-Loir, Sarthe). Thème noir & doré, PWA installable, QR code fourni.

## Structure

- `index.html` — page publique du site (avec calendrier de réservation)
- `admin.html` — espace admin protégé par mot de passe (gestion des réservations)
- `assets/css/style.css` — charte graphique noir & doré + calendrier
- `assets/css/admin.css` — styles de l'espace admin
- `assets/js/script.js` — interactions, chargement des données, formulaire, PWA
- `assets/js/booking.js` — calendrier de réservation public (Firebase Firestore)
- `assets/js/admin.js` — connexion admin + tableau de bord temps réel (Firebase Auth + Firestore)
- `assets/js/firebase-config.js` — clés du projet Firebase (à remplacer, voir ci-dessous)
- `firestore.rules` — règles de sécurité Firestore (à coller dans la console Firebase)
- `data/data.json` — mixes, événements et tarifs (modifiable sans toucher au HTML)
- `scripts/data_manager.py` — utilitaire CLI pour gérer `data.json` (`python scripts/data_manager.py`)
- `manifest.json` / `admin-manifest.json` / `service-worker.js` — configuration PWA (site + admin,
  installables séparément sur mobile/desktop)
- `assets/images/qrcode-djkreobass.png` — QR code pointant vers la démo en ligne

## Calendrier de réservation partagé (Firebase)

Le calendrier de réservation (sur le site) et l'espace admin (`admin.html`) partagent la même base
de données Firebase en temps réel : une réservation faite sur le site apparaît instantanément dans
le tableau de bord admin, sur n'importe quel appareil connecté (toi et ton ami en même temps).

### 1. Créer le projet Firebase (gratuit)

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com) et créer un projet
   (ex : `djkreobass-booking`).
2. **Firestore Database** → Créer une base → mode production → région `eur3` (Europe).
3. **Authentication** → Sign-in method → activer **Email/Password**.
4. **Authentication** → Users → ajouter un compte pour toi et un pour ton ami (email + mot de passe)
   — ce sont les identifiants de connexion à `admin.html`.
5. **Paramètres du projet** → Général → "Vos applications" → ajouter une app **Web** → copier
   l'objet `firebaseConfig` affiché.

### 2. Configurer le site

Coller les valeurs copiées dans `assets/js/firebase-config.js` (remplace les `REMPLACER_...`).
Ces clés ne sont pas secrètes — elles sont prévues pour être visibles côté client. La vraie sécurité
vient des règles Firestore.

### 3. Appliquer les règles de sécurité

Dans la console Firebase → Firestore Database → **Règles**, coller le contenu du fichier
`firestore.rules` de ce dépôt, puis publier. Ces règles garantissent que :

- un visiteur du site peut proposer une réservation (statut "en attente") mais ne peut jamais lire
  les coordonnées des autres demandes ;
- seuls les comptes admin connectés (toi et ton ami) peuvent consulter, confirmer, refuser ou
  ajouter des réservations.

### 4. Installer l'app admin sur le téléphone de ton ami

Ouvrir `admin.html` (ex : `https://<ton-site>/admin.html`) dans le navigateur du téléphone, se
connecter avec son compte, puis "Ajouter à l'écran d'accueil" (Chrome/Android) ou "Sur l'écran
d'accueil" (Safari/iOS) — l'app s'installe comme une app native, avec son propre nom et icône.

## À configurer avant la mise en production

1. **Firebase** : voir la section ci-dessus — indispensable pour que le calendrier fonctionne.
2. **Formulaire de contact** : le formulaire pointe vers `https://formspree.io/f/VOTRE_ID_FORMSPREE`
   dans `index.html`. Créer un compte gratuit sur [formspree.io](https://formspree.io), créer un
   formulaire, et remplacer `VOTRE_ID_FORMSPREE` par l'identifiant réel fourni. (Sert uniquement de
   notification email — la réservation elle-même est déjà enregistrée dans Firestore.)
3. **Coordonnées** : téléphone et email dans la section Contact sont des placeholders à remplacer.
4. **Avis clients** : la section "Avis" est prête à afficher les avis Google dès que la fiche
   établissement Google Business de DJ KREOBASS existe — en attendant elle renvoie vers la page
   Facebook officielle.
5. **Réseaux sociaux** : liens Instagram/YouTube sont des placeholders (`#`) à remplacer par les
   vrais comptes.

## Développement local

Ouvrir `index.html` via un petit serveur local (le `fetch()` de `data/data.json` ne fonctionne pas
en `file://`) :

```bash
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement

Le site est 100% statique (HTML/CSS/JS) : il peut être hébergé gratuitement sur GitHub Pages,
Netlify, Vercel ou tout hébergement statique.
