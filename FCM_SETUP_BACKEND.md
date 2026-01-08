# Configuration Firebase Cloud Messaging - Backend

## Étape finale: Activer FCM sur le serveur

Pour que le backend puisse envoyer des notifications FCM, vous devez configurer les credentials Firebase Admin.

### Option 1: Service Account Key (Recommandé pour production)

1. **Télécharger la clé de service Firebase**:
   - Allez dans [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet
   - Cliquez sur l'icône ⚙️ > **Project Settings**
   - Allez dans l'onglet **Service Accounts**
   - Cliquez sur **Generate new private key**
   - Sauvegardez le fichier JSON téléchargé dans `kayniou-liggey-backend/firebase-service-account.json`

2. **Mettre à jour le code backend**:

   Dans `kayniou-liggey-backend/src/utils/pushNotificationSender.js`, remplacez:

   ```javascript
   admin.initializeApp({
     credential: admin.credential.applicationDefault(),
   });
   ```

   Par:

   ```javascript
   const serviceAccount = require('../../firebase-service-account.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
   });
   ```

3. **Sécurité**: Ajoutez le fichier à `.gitignore`:
   ```bash
   echo "firebase-service-account.json" >> .gitignore
   ```

### Option 2: Variables d'environnement (Alternative)

Vous pouvez aussi utiliser des variables d'environnement:

1. Créez un fichier `.env` dans `kayniou-liggey-backend/`:
   ```
   FIREBASE_PROJECT_ID=votre-project-id
   FIREBASE_CLIENT_EMAIL=votre-client-email
   FIREBASE_PRIVATE_KEY="votre-private-key"
   ```

2. Dans `pushNotificationSender.js`:
   ```javascript
   admin.initializeApp({
     credential: admin.credential.cert({
       projectId: process.env.FIREBASE_PROJECT_ID,
       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
     }),
   });
   ```

## Tester FCM

Après configuration:

1. **Redémarrez le serveur backend**:
   ```bash
   cd kayniou-liggey-backend
   npm start
   ```

2. **Compilez et installez l'APK**:
   ```bash
   cd kayniou-liggey-rn/android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

3. **Installez l'APK sur votre téléphone**:
   - L'APK sera dans `android/app/build/outputs/apk/release/app-release.apk`

4. **Testez**:
   - Ouvrez l'app
   - Allez dans le menu Notifications Test
   - Cliquez sur "Réenregistrer Push Token"
   - Vérifiez les logs - vous devriez voir un token FCM
   - Testez l'envoi d'une notification

## Logs à surveiller

**Frontend (APK)**: Utilisez `adb logcat` pour voir les logs:
```bash
adb logcat | grep -E "FCM|PUSH|Token"
```

**Backend**: Vous devriez voir:
```
✅ Firebase Admin initialisé
🔥 ========== DÉBUT ENVOI FCM NOTIFICATION ==========
✅ Notification FCM envoyée avec succès!
```

## Dépannage

### "Firebase Admin non initialisé"
- Vérifiez que le fichier `firebase-service-account.json` existe
- Vérifiez que les permissions du fichier sont correctes

### "Invalid registration token"
- Le token FCM a expiré ou est invalide
- Demandez à l'utilisateur de se reconnecter ou cliquez sur "Réenregistrer Push Token"

### Notifications ne s'affichent pas
- Vérifiez que les permissions Android sont accordées
- Vérifiez que l'app n'est pas en mode "Ne pas déranger"
- Vérifiez les logs FCM dans Firebase Console > Cloud Messaging
