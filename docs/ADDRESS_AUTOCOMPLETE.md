# Autocomplétion d'adresse - Guide rapide

## 🎯 Fonctionnalité implémentée

Le champ "Localisation" dans le formulaire de création d'annonce possède maintenant l'autocomplétion d'adresse via Google Places API.

## ✅ Ce qui a été fait

1. ✅ Chargement direct de l'API Google Maps (sans dépendance externe)
2. ✅ Création du composant `AddressAutocomplete`
3. ✅ Intégration dans le formulaire de création d'annonce
4. ✅ Configuration automatique avec debounce et gestion du clavier
5. ✅ Style cohérent avec le design system (dark mode, violet)
6. ✅ Fallback vers input texte simple si pas de clé API

## 🚀 Mise en route

### 1. Obtenir une clé API Google (gratuit jusqu'à 28 000 requêtes/mois)

Suivez le guide complet : [`docs/GOOGLE_MAPS_SETUP.md`](./GOOGLE_MAPS_SETUP.md)

### 2. Configuration rapide

Créez le fichier `.env.local` à la racine du projet :

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_clé_api
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

## 📱 Utilisation

1. Accédez à la page `/agent`
2. Cliquez sur le champ "Localisation"
3. Commencez à taper (ex: "Paris", "Lyon", "Marseille")
4. Sélectionnez une suggestion avec la souris ou les flèches du clavier
5. Appuyez sur Entrée pour valider

## ⌨️ Raccourcis clavier

- `↓` / `↑` : Naviguer dans les suggestions
- `Entrée` : Sélectionner la suggestion
- `Échap` : Fermer la liste

## 🔧 Fonctionnalités

- ✨ Suggestions en temps réel
- 🇫🇷 Restreint aux adresses françaises
- ⚡ Debounce (300ms) pour optimiser les requêtes
- 🎨 Highlight visuel lors de la modification
- ♿ Accessible au clavier
- 📱 Responsive
- 🌐 Fonctionne sans clé API (mode dégradé)

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/
│   │   ├── AddressAutocomplete.tsx  ← Composant principal
│   │   └── index.ts                 ← Export
│   └── agent/
│       └── workspace/
│           └── views/
│               └── CreateListingView.tsx  ← Intégration
└── docs/
    ├── ADDRESS_AUTOCOMPLETE.md      ← Ce fichier
    └── GOOGLE_MAPS_SETUP.md         ← Guide de configuration
```

## 🎨 Composant réutilisable

Le composant `AddressAutocomplete` peut être utilisé ailleurs dans l'application :

```tsx
import { AddressAutocomplete } from '@/components/ui'

<AddressAutocomplete
  value={address}
  onChange={setAddress}
  isHighlighted={false}
  placeholder="Entrez une adresse..."
/>
```

## 🐛 Dépannage

### Aucune suggestion n'apparaît

1. Vérifiez que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est dans `.env.local`
2. Redémarrez le serveur (`npm run dev`)
3. Ouvrez la console du navigateur pour voir les erreurs

### Erreur "RefererNotAllowedMapError"

Ajoutez `localhost:3000/*` dans les restrictions HTTP referrers de votre clé API.

### Erreur "ApiNotActivatedMapError"

Activez "Places API" dans Google Cloud Console.

## 💡 Alternative gratuite

Si vous voulez éviter Google Maps, le code peut être adapté pour utiliser :
- **Nominatim (OpenStreetMap)** : 100% gratuit
- **Mapbox** : 100 000 requêtes gratuites/mois

Contactez-moi si vous souhaitez cette modification.

## 📊 Coûts

| Utilisation | Coût |
|------------|------|
| 0 - 28 000 requêtes/mois | **Gratuit** |
| Au-delà | $2.83 USD / 1000 requêtes |

Pour une petite/moyenne application, vous resterez dans le quota gratuit.

