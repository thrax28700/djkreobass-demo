# DJ KREOBASS — Site vitrine (démo)

Site vitrine statique pour DJ KREOBASS, animateur professionnel en Centre-Val de Loire (Chartres, Eure-et-Loir, Sarthe). Thème noir & doré, PWA installable, QR code fourni.

## Structure

- `index.html` — page publique du site (avec calendrier de réservation)
- `admin.html` — espace admin protégé par mot de passe (réservations + devis/factures)
- `devis.html` — page publique où le client consulte et accepte/refuse un devis (lien envoyé par email)
- `assets/css/style.css` — charte graphique noir & doré + calendrier
- `assets/css/admin.css` — styles de l'espace admin
- `assets/css/devis.css` — styles de la page publique devis/facture
- `assets/js/script.js` — interactions, chargement des données, formulaire, PWA
- `assets/js/booking.js` — calendrier de réservation public (Firebase Firestore)
- `assets/js/admin.js` — connexion admin + tableau de bord temps réel (réservations + devis/factures)
- `assets/js/devis-view.js` — logique de la page publique `devis.html`
- `assets/js/pdf-generator.js` — génère le PDF d'un devis/facture (utilisé par l'admin et `devis.html`)
- `assets/js/firebase-config.js` — clés du projet Firebase (à remplacer, voir ci-dessous)
- `assets/js/emailjs-config.js` — clés EmailJS pour l'envoi automatique des devis/factures (à remplacer)
- `assets/js/business-info.js` — infos légales (SIRET, IBAN…) utilisées sur les PDF (à remplacer)
- `firestore.rules` — règles de sécurité Firestore (à coller dans la console Firebase)
- `data/data.json` — mixes, événements et tarifs (modifiable sans toucher au HTML)
- `scripts/data_manager.py` — utilitaire CLI pour gérer `data.json` (`python scripts/data_manager.py`)
- `manifest.json` / `admin-manifest.json` / `service-worker.js` — configuration PWA (site + admin,
  installables séparément sur mobile/desktop)
- `assets/images/qrcode-djkreobass.png` — QR code pointant vers la démo en ligne

## Configurateur de tarifs ("Composez votre soirée")

La section Tarifs est un parcours en 3 étapes, sans IA réelle (donc gratuit et sans compte à créer) :

1. **Guide par questions** : 3 questions simples (occasion, lieu, ambiance recherchée) ; chaque réponse
   pondère un score par type d'événement, et le site recommande automatiquement la formule la plus
   probable ("D'après vos réponses, on vous recommande..."), tout en laissant le visiteur en choisir
   une autre. Un lien "Je sais déjà ce que je veux" permet de sauter directement à l'étape suivante.
2. **Options illustrées** : chaque option (éclairage, machine à fumée, photobooth...) est une carte
   avec photo ; cliquer dessus ouvre une **modale** avec une photo plus grande, une description et un
   bouton "Ajouter à ma sélection" / "Retirer".
3. **Résumé & devis** : total indicatif en direct, puis le bouton final pré-remplit automatiquement le
   formulaire de contact (type d'événement + récapitulatif de la configuration dans le message) avant
   de l'envoyer vers la demande de devis.

Tout est piloté par `data/data.json` :

- `pricing[].basePrice` et `pricingOptions[].price` sont à **0 par défaut** → le configurateur
  affiche alors "Sur devis" au lieu d'un montant. Renseigne un prix indicatif (en euros, nombre, sans
  symbole) dès que vous avez des tarifs de base à communiquer, et le total se calcule automatiquement.
- `pricingOptions[].photo` est à **vide par défaut** → la carte et la modale affichent une icône à la
  place. Pour ajouter une vraie photo, dépose le fichier dans `assets/images/options/` (dossier à
  créer) et renseigne son chemin, ex. `"photo": "assets/images/options/eclairage.jpg"`.
- `pricingOptions[].description` est le texte affiché dans la modale — à adapter librement.
- Pour ajouter/retirer une option, modifie le tableau `pricingOptions` (`id`, `label`, `description`,
  `price`, `photo`). L'icône de secours dépend de l'`id` (`lighting`, `fog`, `photobooth`, `sound`,
  `hour`, `mc` sont déjà prévus dans `assets/js/script.js` → `OPTION_ICONS` ; pour un nouvel `id`,
  ajoute son icône SVG dans ce même objet, sinon une icône générique s'affiche).
- Les 4 formules (`pricing[]`) gardent leur `id` aligné sur les types d'événement du site
  (`wedding`, `birthday`, `corporate`, `bar`) pour que la sélection remplisse correctement le
  formulaire de contact, et sur les poids du questionnaire (`QUIZ_QUESTIONS` dans `script.js`).

## Calendrier de réservation partagé (Firebase)

Le calendrier de réservation (sur le site) et l'espace admin (`admin.html`) partagent la même base
de données Firebase en temps réel : une réservation faite sur le site apparaît instantanément dans
le tableau de bord admin, sur n'importe quel appareil connecté (toi et ton ami en même temps).

Une fois qu'une réservation est **confirmée** par toi ou ton ami dans l'espace admin, elle apparaît
automatiquement dans la section "Événements" (À venir) du site public :
- **Soirée Bar / Guinguette** → affichée avec le nom du lieu (champ "Nom du lieu" du formulaire) ;
- **Mariage / Anniversaire / Séminaire** → affichée de façon anonyme sous le libellé "Soirée privée",
  sans nom du client ni lieu, pour préserver la confidentialité de tes clients.

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

## Devis & Factures (envoi automatique par email)

Depuis l'onglet **Devis & Factures** de `admin.html` :

1. Clique **+ Nouveau devis**, remplace-le éventuellement à partir d'une réservation existante
   (auto-remplit nom/email/date/lieu), ajoute les lignes de prestations (description, quantité, prix).
2. À la validation, le devis est enregistré dans Firestore, numéroté (`DEV-AAAAMMJJ-HHMMSS`), et un
   email est envoyé automatiquement au client avec un lien vers `devis.html?id=...`.
3. Le client ouvre ce lien (sans compte à créer), voit le détail du devis, peut le télécharger en PDF,
   puis clique **Accepter** ou **Refuser**. La réponse apparaît en temps réel dans l'admin.
4. Une fois le devis **Accepté**, le bouton **Générer la facture** crée automatiquement la facture
   correspondante (mêmes lignes), l'envoie au client par email, et marque le devis comme "Facturé".
5. Quand le client a payé, clique **Marquer payée** sur la facture.

À tout moment : **Télécharger PDF** génère le document (devis ou facture) dans le navigateur, et
**Renvoyer l'email** ré-expédie le lien si besoin.

### Configurer l'envoi automatique (EmailJS, gratuit)

1. Créer un compte sur [emailjs.com](https://www.emailjs.com) (200 emails/mois gratuits).
2. **Email Services** → ajouter un service → connecter `deejaykreobass@gmail.com` → copier le
   **Service ID**.
3. **Email Templates** → créer un template "Devis" utilisant les variables `to_email`, `to_name`,
   `quote_number`, `quote_type`, `event_label`, `total`, `valid_until`, `view_link`, `message` →
   copier le **Template ID**. Dupliquer ce template pour "Facture" (mêmes variables).
4. **Account** → copier la **Public Key**.
5. Renseigner ces 4 valeurs dans `assets/js/emailjs-config.js`.

Tant que ce fichier n'est pas configuré, les devis/factures sont quand même créés et téléchargeables
en PDF — seul l'envoi automatique par email est désactivé (un lien à envoyer manuellement est affiché
à la place).

### Renseigner les informations légales

Les PDF de devis/factures et la page `devis.html` affichent les informations de
`assets/js/business-info.js` (nom/raison sociale, adresse, SIRET, mention TVA, IBAN/BIC pour les
règlements par virement). **À remplir avant d'envoyer une vraie facture** — une facture doit
légalement mentionner un SIRET. Tant que ce n'est pas fait, l'admin affiche un avertissement.

## À configurer avant la mise en production

1. **Firebase** : voir la section ci-dessus — indispensable pour que le calendrier et les devis/factures
   fonctionnent.
2. **EmailJS** et **informations légales** : voir la section Devis & Factures ci-dessus.
3. **Formulaire de contact** : le formulaire pointe vers `https://formspree.io/f/VOTRE_ID_FORMSPREE`
   dans `index.html`. Créer un compte gratuit sur [formspree.io](https://formspree.io), créer un
   formulaire, et remplacer `VOTRE_ID_FORMSPREE` par l'identifiant réel fourni. (Sert uniquement de
   notification email — la réservation elle-même est déjà enregistrée dans Firestore.)
4. **Coordonnées** : téléphone (06 66 35 90 65), WhatsApp et email (`deejaykreobass@gmail.com`) sont
   déjà en place dans la section Contact et le bouton flottant WhatsApp.
5. **Avis clients** : la section "Avis" est prête à afficher les avis Google dès que la fiche
   établissement Google Business de DJ KREOBASS existe — en attendant elle renvoie vers la page
   Facebook officielle.
6. **Réseaux sociaux** : liens Instagram/YouTube sont des placeholders (`#`) à remplacer par les
   vrais comptes.

## Développement local

Ouvrir `index.html` via un petit serveur local (le `fetch()` de `data/data.json` ne fonctionne pas
en `file://`) :

```bash
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement (Vercel, gratuit)

Le site est 100% statique (HTML/CSS/JS) : Vercel le détecte automatiquement, aucune configuration
particulière n'est nécessaire.

**Option A — depuis le site Vercel (le plus simple, sans rien installer) :**

1. Aller sur [vercel.com](https://vercel.com/new) et se connecter avec le compte GitHub
   `thrax28700`.
2. **Import Git Repository** → choisir `thrax28700/djkreobass-demo`.
3. Laisser les réglages par défaut (Framework Preset : *Other*) → **Deploy**.
4. Le site est en ligne en ~30 secondes sur une URL `djkreobass-demo.vercel.app` (personnalisable
   dans Project Settings → Domains, y compris avec un nom de domaine perso si tu en achètes un).
5. Chaque `git push` sur `master` redéploie automatiquement le site.

**Option B — en ligne de commande :**

```bash
npx vercel login     # ouvre une page de connexion dans le navigateur
npx vercel --prod     # déploie le dossier courant en production
```

Le site peut aussi être hébergé gratuitement sur GitHub Pages, Netlify ou tout hébergement statique.
