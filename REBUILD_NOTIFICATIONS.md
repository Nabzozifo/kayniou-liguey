# 🔔 Rebuild APK pour Notifications Système

## ✅ Problème résolu

L'`app.json` avait **3 erreurs critiques** qui empêchaient les notifications système de fonctionner:

1. ❌ `"projectId": "kayniou-liggey-rn"` au mauvais endroit (niveau racine)
2. ❌ `"developer": {}` (propriété obsolète)
3. ❌ `"useNextNotificationsApi": true` (déprécié dans Expo SDK 54)

**Résultat:** Expo ignorait certaines parties de la config → notifications cassées

## ✅ Corrections appliquées

### 1. `app.json` maintenant conforme:
- ✅ Supprimé `projectId` du niveau racine
- ✅ Supprimé `developer` (obsolète)
- ✅ Supprimé `useNextNotificationsApi` (déprécié)
- ✅ Gardé `extra.eas.projectId` (emplacement correct)
- ✅ Ajouté permissions GPS pour suivi chantier
- ✅ Ajouté plugin `expo-location`

### 2. `notificationService.js` corrigé:
- ✅ Supprimé `projectId` de `getExpoPushTokenAsync()`
- ✅ Expo lit automatiquement depuis `extra.eas.projectId`

### 3. Validation:
```bash
npx expo-doctor
```
**Résultat:** ✅ **17/17 checks passed** - Configuration 100% valide!

---

## 🚀 ÉTAPES OBLIGATOIRES (À FAIRE MAINTENANT)

### Étape 1: Nettoyage complet

```bash
cd kayniou-liggey-rn
npx expo prebuild --clean
```

⚠️ **IMPORTANT:** Cette commande va régénérer les dossiers `android/` et `ios/` avec la nouvelle config

**Durée:** ~2 minutes

---

### Étape 2: Build APK

```bash
cd android
./gradlew assembleRelease
```

**Durée:** ~5-10 minutes

**Fichier produit:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

### Étape 3: Installation sur téléphone

#### Option A: Via USB (Recommandé)
```bash
adb devices
adb install app/build/outputs/apk/release/app-release.apk
```

#### Option B: Copie manuelle
1. Copier `app-release.apk` sur le téléphone
2. Ouvrir avec "Mes Fichiers" sur Android
3. Installer (autoriser sources inconnues si nécessaire)

---

## 🧪 Tests à faire IMMÉDIATEMENT après installation

### 1. Test Rapide (2 minutes)

1. **Ouvrir l'app**
2. **Aller dans:** Profil → Test Notifications
3. **Vérifier le statut:**
   - ✅ Permissions: `granted`
   - ✅ Expo Push Token: `ExponentPushToken[...]`
   - ✅ Canaux Android: `3 configurés`

4. **Test notification basique:**
   - Cliquer sur "Test Notification Basique"
   - **Mettre l'app en arrière-plan** (bouton home)
   - ✅ **Vérifier:** Notification apparaît dans la barre système Android

5. **Test tous les types:**
   - Cliquer sur "Tester Tous les Types (7)"
   - **Mettre l'app en arrière-plan**
   - ✅ **Vérifier:** 7 notifications arrivent sur 14 secondes

---

### 2. Vérification Canaux Android (1 minute)

1. **Paramètres Android** → Apps → Kayniou Liggey → Notifications
2. ✅ **Vérifier 3 canaux:**
   - **Notifications générales** (Importance: MAX)
   - **Messages importants** (Importance: MAX)
   - **Suivi de chantier** (Importance: Élevée)

---

### 3. Test Fonctionnel Complet (5 minutes)

#### Test GPS + Notifications Chantier:

1. **Créer un chantier de test** (ou utiliser un existant)
2. **Worker:** Aller dans Détails du chantier
3. **Cliquer:** "Partir en route" → GPS demandé ✅
4. **Cliquer:** "Marquer arrivé" → GPS validé ✅
5. **Client reçoit notification:** "Le worker est arrivé sur le chantier" ✅
6. **Cliquer:** "Commencer travail" (débloqué après arrivée GPS) ✅
7. **Client reçoit notification:** "Le worker a commencé les travaux" ✅

---

## ✅ Résultat attendu

### Notifications Système:
- ✅ Apparaissent dans la barre de notifications Android
- ✅ Fonctionnent même si l'app est fermée
- ✅ Son, vibration et badge configurés
- ✅ Visibles sur écran verrouillé
- ✅ 3 canaux distincts avec priorités appropriées

### Anti-Fraude GPS:
- ✅ Worker doit être physiquement arrivé pour démarrer
- ✅ Validation GPS < 500m pour "arrivé"
- ✅ Validation GPS < 200m pour "commencer travail"
- ✅ Boutons grisés tant que conditions non remplies

---

## 🐛 Dépannage

### Problème 1: APK ne s'installe pas
```bash
adb uninstall com.anonymous.kayniouliggeyrn
adb install app/build/outputs/apk/release/app-release.apk
```

### Problème 2: Notifications n'apparaissent pas
1. Vérifier: Paramètres → Apps → Notifications (activées?)
2. Désactiver "Ne pas déranger"
3. Redémarrer le téléphone
4. Réinstaller l'APK

### Problème 3: Token non généré
1. Vérifier connexion internet
2. Vérifier logs: `adb logcat | grep -i expo`
3. Réinstaller l'APK

### Problème 4: GPS ne fonctionne pas
1. Vérifier: Paramètres → Apps → Permissions → Localisation (autorisée?)
2. Activer GPS dans les paramètres Android
3. Tester en extérieur (signal GPS plus fort)

---

## 📚 Logs utiles

### Voir les logs en temps réel:
```bash
adb logcat | grep -E "Expo|Notification|GPS"
```

### Filtrer uniquement les notifications:
```bash
adb logcat | grep -i notif
```

### Voir les permissions:
```bash
adb shell pm list permissions -d -g
```

---

## 🎯 Checklist Finale

Avant de valider que tout fonctionne:

- [ ] `npx expo-doctor` → 17/17 checks passed
- [ ] APK installée sur téléphone
- [ ] Permissions notifications accordées
- [ ] Permissions GPS accordées
- [ ] Token Expo Push généré et visible
- [ ] 3 canaux Android configurés
- [ ] Notification test apparaît dans barre système
- [ ] App en arrière-plan → notifications visibles
- [ ] GPS tracking fonctionne (arrivée validée)
- [ ] Anti-fraude: bouton "Commencer travail" débloqué après arrivée GPS

---

## 📊 Différence Avant/Après

### ❌ AVANT (app.json invalide):
- Notifications uniquement dans l'app
- Rien dans la barre système Android
- Config ignorée par Expo
- `expo-doctor` → 3 erreurs

### ✅ APRÈS (app.json conforme):
- Notifications système fonctionnelles
- Visibles dans barre système
- Config respectée par Expo
- `expo-doctor` → 17/17 ✅

---

## 🚀 Commandes Rapides

### Rebuild complet (tout en une fois):
```bash
cd kayniou-liggey-rn
npx expo prebuild --clean
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

### Vérifier statut:
```bash
npx expo-doctor
adb devices
adb shell pm list packages | grep kayniou
```

---

## 📞 Support

Si les notifications ne marchent toujours pas après le rebuild:

1. Vérifier ce guide étape par étape
2. Consulter [PUSH_NOTIFICATIONS_SETUP.md](PUSH_NOTIFICATIONS_SETUP.md) pour Firebase FCM
3. Tester avec l'écran "Test Notifications" dans l'app (Profil → Test Notifications)

---

**Dernière mise à jour:** Configuration validée avec `expo-doctor` ✅
**Commit:** `15f9b4c - Fix: Configuration app.json conforme schéma Expo`
