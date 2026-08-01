# DJ KREOBASS — Site vitrine (démo)

Site vitrine statique pour DJ KREOBASS, animateur & platiniste professionnel en Centre-Val de Loire (Chartres, Eure-et-Loir, Sarthe). Thème noir & doré, PWA installable, QR code fourni.

## Structure

- `index.html` — page unique du site
- `assets/css/style.css` — charte graphique noir & doré
- `assets/js/script.js` — interactions, chargement des données, formulaire, PWA
- `data/data.json` — mixes, événements et tarifs (modifiable sans toucher au HTML)
- `scripts/data_manager.py` — utilitaire CLI pour gérer `data.json` (`python scripts/data_manager.py`)
- `manifest.json` / `service-worker.js` — configuration PWA (installable sur mobile/desktop)
- `assets/images/qrcode-djkreobass.png` — QR code pointant vers la démo en ligne

## À configurer avant la mise en production

1. **Formulaire de contact** : le formulaire pointe vers `https://formspree.io/f/VOTRE_ID_FORMSPREE`
   dans `index.html`. Créer un compte gratuit sur [formspree.io](https://formspree.io), créer un
   formulaire, et remplacer `VOTRE_ID_FORMSPREE` par l'identifiant réel fourni.
2. **Coordonnées** : téléphone et email dans la section Contact sont des placeholders à remplacer.
3. **Avis clients** : la section "Avis" est prête à afficher les avis Google dès que la fiche
   établissement Google Business de DJ KREOBASS existe — en attendant elle renvoie vers la page
   Facebook officielle.
4. **Réseaux sociaux** : liens Instagram/YouTube sont des placeholders (`#`) à remplacer par les
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
