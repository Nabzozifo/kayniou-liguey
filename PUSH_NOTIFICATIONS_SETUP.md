# Configuration des Push Notifications Système

## ✅ Ce qui est déjà configuré

### 1. Expo Notifications
- ✅ expo-notifications installé (package.json)
- ✅ Configuration des canaux Android (notificationService.js):
  - Canal "default" (notifications générales) - Importance MAX
  - Canal "important" (messages, devis) - Importance MAX
  - Canal "worksite" (suivi chantier) - Importance HIGH
- ✅ Configuration AndroidManifest.xml pour notifications
- ✅ Network security config pour connexions HTTP

### 2. Backend
- ✅ Endpoint `/notifications/register-token` pour enregistrer les tokens
- ✅ Fonction `sendPushNotification` dans le backend
- ✅ Notifications envoyées lors des événements (nouveau devis, message, etc.)

## 🔧 Configuration requise pour les vraies push notifications

### Option 1: Utiliser Expo Push Notification Service (Recommandé pour le développement)

**Avantages:**
- Simple et rapide
- Pas besoin de configuration Firebase
- Gratuit jusqu'à 1M de notifications/mois

**Configuration actuelle:**
```javascript
// src/services/notificationService.js - Ligne 48
const token = (await Notifications.getExpoPushTokenAsync({
  projectId: 'kayniou-liggey-rn'
})).data;
```

**Actions nécessaires:**
1. Vérifier que le projectId correspond à votre projet Expo
2. Les tokens Expo sont automatiquement générés
3. Le backend doit utiliser l'API Expo pour envoyer les notifications

### Option 2: Firebase Cloud Messaging (FCM) - Pour production

**Configuration nécessaire:**

1. **Créer un projet Firebase:**
   - Aller sur https://console.firebase.google.com/
   - Créer un nouveau projet "Kayniou Liggey"
   - Ajouter une application Android avec le package name de votre app

2. **Télécharger google-services.json:**
   - Dans Firebase Console > Project Settings
   - Télécharger le fichier `google-services.json`
   - Le placer dans: `kayniou-liggey-rn/android/app/`

3. **Mettre à jour app.json:**
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.votreentreprise.kayniouliggey"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#4A90E2",
          "mode": "production",
          "androidMode": "default",
          "androidCollapsedTitle": "#{unread_notifications} nouvelles notifications"
        }
      ]
    ]
  }
}
```

4. **Obtenir la clé serveur FCM:**
   - Firebase Console > Project Settings > Cloud Messaging
   - Copier la "Server Key"
   - L'ajouter dans votre backend (.env):
```
FCM_SERVER_KEY=votre_cle_serveur_fcm_ici
```

5. **Mettre à jour le backend pour utiliser FCM:**
```javascript
// backend - sendPushNotification function
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

async function sendPushNotification(token, title, body, data) {
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: data.channelId || 'default',
          sound: 'default',
        },
      },
    });
  } catch (error) {
    console.error('Erreur push notification:', error);
  }
}
```

## 📱 Tester les notifications

### En développement avec Expo Go:
```bash
npx expo start
```
- Les notifications locales fonctionnent ✅
- Les push notifications Expo fonctionnent ✅
- Les canaux Android sont créés ✅

### En production (APK):
```bash
# 1. Configurer FCM (voir ci-dessus)
# 2. Rebuild l'app
npx expo prebuild --clean
cd android
./gradlew assembleRelease

# 3. Installer l'APK
adb install app/build/outputs/apk/release/app-release.apk
```

## 🧪 Test manuel des notifications

### Backend - Envoyer une notification test:
```javascript
// Dans votre backend, endpoint de test
router.post('/test-notification', protect, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user.expoPushToken) {
    await sendPushNotification(
      user.expoPushToken,
      'Test de notification',
      'Si vous voyez ceci, les notifications fonctionnent!',
      { type: 'test' }
    );
    res.json({ success: true, message: 'Notification envoyée' });
  } else {
    res.status(400).json({ success: false, message: 'Pas de token push' });
  }
});
```

### Frontend - Déclencher une notification locale:
```javascript
import notificationService from '../services/notificationService';

// Dans n'importe quel écran
await notificationService.sendLocalNotification(
  'Test notification locale',
  'Ceci est une notification de test',
  { type: 'test' }
);
```

## ✅ Vérification

**Pour vérifier que tout fonctionne:**

1. **Token enregistré:**
   - Ouvrir l'app
   - Vérifier dans les logs: "✅ Expo Push Token: ExponentPushToken[...]"
   - Le token doit être sauvegardé dans MongoDB (champ `expoPushToken`)

2. **Canaux Android créés:**
   - Android: Paramètres > Apps > Kayniou Liggey > Notifications
   - Vous devez voir 3 canaux:
     - Notifications générales
     - Messages importants
     - Suivi de chantier

3. **Notifications système apparaissent:**
   - Mettre l'app en arrière-plan
   - Envoyer une notification test depuis le backend
   - La notification doit apparaître dans la barre système Android

## 🐛 Dépannage

**Les notifications n'apparaissent pas dans la barre système:**
1. Vérifier les permissions: Paramètres > Apps > Notifications (doivent être activées)
2. Vérifier le mode "Ne pas déranger" (désactiver temporairement)
3. Vérifier les logs: `adb logcat | grep -i notif`
4. Tester avec une notification locale d'abord

**Token push non enregistré:**
1. Vérifier la connexion réseau
2. Vérifier que le backend est accessible
3. Vérifier les logs du backend pour l'endpoint `/notifications/register-token`

**Notifications ne s'affichent qu'en premier plan:**
1. Vérifier que le canal Android a `importance: MAX`
2. Vérifier que `priority: HIGH` est défini
3. Rebuilder l'APK après modifications

## 📚 Ressources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android Notification Channels](https://developer.android.com/training/notify-user/channels)
