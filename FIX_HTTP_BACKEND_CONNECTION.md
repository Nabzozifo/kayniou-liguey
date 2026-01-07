# 🔧 Fix: Connexion HTTP Backend (Cleartext Traffic)

## ❌ Problème

L'APK buildé par EAS Build ne peut pas se connecter au backend EC2:
- **Backend URL**: `http://16.171.193.183:5000/api`
- **Erreur**: Android 9+ bloque par défaut les connexions HTTP (cleartext) non cryptées
- **Impact**: L'app ne peut ni s'authentifier, ni charger les données

## ✅ Solution appliquée

### 1. Plugin Expo pour Cleartext Traffic

**Fichier créé**: `plugins/withCleartextTraffic.js`

```javascript
const { withAndroidManifest } = require('@expo/config-plugins');

const withCleartextTraffic = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ajouter android:usesCleartextTraffic="true"
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    console.log('✅ Plugin cleartext traffic appliqué - HTTP autorisé');

    return config;
  });
};

module.exports = withCleartextTraffic;
```

**Pourquoi ce plugin?**
- EAS Build utilise `npx expo prebuild` qui régénère l'AndroidManifest
- Les modifications manuelles dans `android/app/src/main/AndroidManifest.xml` sont écrasées
- Le plugin garantit que `usesCleartextTraffic` est toujours appliqué

### 2. Configuration app.json

**Ajouté dans `app.json`:**

```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true,
      // ... autres configs
    },
    "plugins": [
      ["expo-notifications", { ... }],
      ["expo-location", { ... }],
      "./plugins/withCleartextTraffic.js"  // ← Plugin ajouté ici
    ]
  }
}
```

### 3. Fichier .easignore créé

**Fichier créé**: `.easignore`

Exclut les dossiers de build pour éviter les erreurs de verrouillage de fichiers:

```
android/build
android/app/build
android/.gradle
android/.cxx
ios/build
ios/Pods
node_modules/.cache
```

## 🧪 Validation

### Vérification de la configuration:

```bash
npx expo config --type introspect | grep -i "cleartext"
```

**Résultat attendu:**
```
✅ Plugin cleartext traffic appliqué - HTTP autorisé
'android:usesCleartextTraffic': 'true'
```

### Build EAS:

```bash
# 1. Arrêter les daemons Gradle
cd android
./gradlew --stop

# 2. Lancer le build
cd ..
npx eas build -p android --profile apk
```

## 📋 Autres corrections simultanées

### Gradle Properties (pour build local)

**Fichier**: `android/gradle.properties`

**Corrections:**
1. ✅ Mémoire augmentée pour éviter OutOfMemoryError:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=2048m
   ```

2. ✅ Architecture réduite pour éviter chemins longs (Windows):
   ```properties
   reactNativeArchitectures=arm64-v8a
   ```

3. ✅ Nouvelle architecture désactivée pour éviter erreur chemins longs:
   ```properties
   newArchEnabled=false
   ```

### AndroidManifest (pour build local)

**Fichier**: `android/app/src/main/AndroidManifest.xml`

**Ajouté:**
```xml
<application
  android:usesCleartextTraffic="true"
  ...
>
```

## 🎯 Résultat final

### ✅ APK buildé avec EAS:
- Autorisation HTTP cleartext activée via plugin ✅
- Connexion au backend `http://16.171.193.183:5000` fonctionnelle ✅

### ✅ APK buildé localement (alternative):
- Configuration manuelle dans AndroidManifest ✅
- Gradle optimisé pour Windows (chemins longs) ✅

## ⚠️ Sécurité - Recommandations production

**Pour la production, il est FORTEMENT recommandé de:**

1. **Mettre en place HTTPS sur EC2:**
   ```bash
   # Installer Certbot sur EC2
   sudo apt update
   sudo apt install certbot

   # Obtenir certificat Let's Encrypt (gratuit)
   sudo certbot certonly --standalone -d votre-domaine.com
   ```

2. **Configurer Nginx/Apache comme reverse proxy:**
   ```nginx
   server {
       listen 443 ssl;
       server_name votre-domaine.com;

       ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

3. **Modifier l'URL dans l'app:**
   ```javascript
   // src/services/api.js
   const API_URL = 'https://votre-domaine.com/api';
   ```

4. **Retirer cleartext traffic:**
   ```json
   // app.json
   {
     "android": {
       "usesCleartextTraffic": false  // ou supprimer la ligne
     }
   }
   ```

## 📚 Références

- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)

---

**Dernière mise à jour**: Configuration validée avec `npx expo config --type introspect` ✅
**Commit**: Ajout plugin cleartext traffic pour connexion HTTP backend
