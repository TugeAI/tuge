# Configuration Google Maps API pour l'autocomplétion d'adresse

## Note technique

L'application charge directement l'API Google Maps via un script, sans dépendance externe. Cela garantit la compatibilité et évite les problèmes de version.

## Obtenir une clé API Google Maps

1. **Accéder à Google Cloud Console**
   - Rendez-vous sur [console.cloud.google.com](https://console.cloud.google.com)
   - Créez un nouveau projet ou sélectionnez un projet existant

2. **Activer l'API Places**
   - Dans le menu latéral, allez dans "APIs & Services" > "Library"
   - Recherchez "Places API"
   - Cliquez sur "Enable" (Activer)

3. **Créer une clé API**
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Une clé API sera générée

4. **Restreindre la clé API (recommandé)**
   - Cliquez sur la clé API créée pour la modifier
   - Dans "Application restrictions" :
     - Sélectionnez "HTTP referrers (web sites)"
     - Ajoutez :
       - `localhost:3000/*` (pour le développement)
       - `votre-domaine.com/*` (pour la production)
   - Dans "API restrictions" :
     - Sélectionnez "Restrict key"
     - Cochez uniquement "Places API"
   - Cliquez sur "Save"

5. **Configurer la variable d'environnement**
   - Créez ou modifiez le fichier `.env.local` à la racine du projet
   - Ajoutez la ligne suivante :
     ```bash
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_clé_api_ici
     ```
   - Remplacez `votre_clé_api_ici` par votre vraie clé API

6. **Redémarrer le serveur de développement**
   ```bash
   npm run dev
   ```

## Quota gratuit

Google offre un quota gratuit généreux :
- **28 000 requêtes gratuites par mois** pour l'Autocomplete
- Au-delà, le coût est de **$2.83 USD pour 1000 requêtes**

## Fonctionnement sans clé API

Si aucune clé API n'est configurée, le champ de localisation fonctionne toujours comme un simple champ de texte sans autocomplétion.

## Vérification

Pour vérifier que la configuration fonctionne :
1. Allez sur `/agent` (page de création d'annonce)
2. Cliquez sur le champ "Localisation"
3. Commencez à taper une ville française (ex: "Paris")
4. Des suggestions devraient apparaître automatiquement

## Dépannage

### Aucune suggestion n'apparaît
- Vérifiez que la clé API est bien dans `.env.local`
- Vérifiez que le fichier commence bien par `NEXT_PUBLIC_`
- Redémarrez le serveur de développement
- Vérifiez dans la console du navigateur s'il y a des erreurs

### Erreur "RefererNotAllowedMapError"
- La restriction HTTP referrers bloque la requête
- Ajoutez `localhost:3000/*` dans les restrictions de la clé API

### Erreur "ApiNotActivatedMapError"
- L'API Places n'est pas activée
- Retournez sur Google Cloud Console et activez "Places API"

## Alternatives gratuites

Si vous souhaitez éviter Google Maps, vous pouvez implémenter :
- **Nominatim (OpenStreetMap)** : 100% gratuit, moins précis
- **Mapbox Geocoding** : Quota gratuit de 100 000 requêtes/mois

