# 🚀 Déploiement Backend sur EC2

## ❌ Problème actuel

L'erreur de notification persiste sur le serveur EC2:
```
ValidationError: `worksite_status` is not a valid enum value for path `type`
```

**Cause**: Le code sur EC2 est obsolète. Le fix a été pushé sur GitHub mais pas déployé.

---

## ✅ Solution: Déployer le nouveau code

### Étape 1: Connexion SSH à EC2

```bash
ssh -i "kayniou.pem" ec2-user@16.171.193.183
```

**Note**: Assurez-vous que le fichier `kayniou.pem` a les bonnes permissions:
```bash
chmod 400 kayniou.pem
```

---

### Étape 2: Pull du nouveau code

```bash
# Aller dans le dossier backend
cd /home/ec2-user/kayniou-liguey/kayniou-liggey-backend

# Pull les derniers commits de GitHub
git pull origin main
```

**Résultat attendu**:
```
Updating 5fa9d00..51b5025
Fast-forward
 src/models/Notification.js | 1 +
 1 file changed, 1 insertion(+)
```

---

### Étape 3: Vérifier les changements

```bash
# Voir le dernier commit
git log -1 --oneline

# Vérifier que worksite_status est ajouté
grep -A 10 "enum:" src/models/Notification.js | grep worksite_status
```

**Résultat attendu**:
```
'worksite_status',
```

---

### Étape 4: Redémarrer le serveur avec PM2

```bash
# Option 1: Redémarrer tous les processus
pm2 restart all

# Option 2: Redémarrer uniquement le backend (si nom spécifique)
pm2 restart kayniou-backend

# Vérifier le statut
pm2 status
```

**Résultat attendu**:
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ restart │ uptime   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ kayniou-backend    │ online  │ 1       │ 5s       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

### Étape 5: Vérifier les logs

```bash
# Voir les logs en temps réel
pm2 logs kayniou-backend --lines 50

# Ou avec tail
tail -f ~/.pm2/logs/kayniou-backend-out.log
```

**Test**: Depuis l'app mobile, cliquer sur "En route" → Plus d'erreur! ✅

---

## 🔍 Vérifications

### 1. Vérifier la version du code

```bash
cd /home/ec2-user/kayniou-liguey/kayniou-liggey-backend
git log --oneline -5
```

**Attendu**: Les 3 derniers commits doivent apparaître:
- `51b5025` - Refactor: ClientWorksiteTracker utilise OpenStreetMap
- `5fa9d00` - Fix: Ajout type notification 'worksite_status' dans enum
- `eb30945` - Fix: Boutons accepter devis + Détection currency automatique

### 2. Vérifier le modèle Notification

```bash
cat src/models/Notification.js | grep -A 20 "enum:"
```

**Attendu**: `'worksite_status'` doit être dans la liste (ligne 38)

### 3. Test manuel

Depuis l'app mobile:
1. Worker ouvre un chantier assigné
2. Clique sur "En route" → ✅ Pas d'erreur
3. Clique sur "Marquer arrivé" → ✅ Pas d'erreur
4. Client reçoit les notifications → ✅ Fonctionne

---

## 🛠️ Commandes PM2 utiles

```bash
# Voir tous les processus
pm2 list

# Redémarrer un processus spécifique
pm2 restart <id ou nom>

# Arrêter un processus
pm2 stop <id ou nom>

# Relancer un processus arrêté
pm2 start <id ou nom>

# Voir les logs d'un processus
pm2 logs <id ou nom>

# Effacer les logs
pm2 flush

# Voir les infos système
pm2 monit

# Sauvegarder la config PM2
pm2 save
```

---

## 📋 Checklist de déploiement

- [ ] SSH connecté à EC2
- [ ] `git pull origin main` exécuté
- [ ] Commit `5fa9d00` présent (avec worksite_status)
- [ ] `pm2 restart all` exécuté
- [ ] `pm2 status` montre "online"
- [ ] Logs ne montrent plus d'erreur enum
- [ ] Test depuis app mobile réussi (En route + Arrivé)

---

## 🚨 Résolution de problèmes

### Erreur: `fatal: not a git repository`

```bash
cd /home/ec2-user/kayniou-liguey/kayniou-liggey-backend
git status
```

Si pas un repo git, re-clone:
```bash
cd /home/ec2-user/kayniou-liguey
rm -rf kayniou-liggey-backend
git clone https://github.com/Nabzozifo/kayniou-liguey.git
cd kayniou-liguey/kayniou-liggey-backend
npm install
pm2 restart all
```

### Erreur: `Permission denied (publickey)`

Votre clé SSH n'est pas configurée sur le serveur:
```bash
# Sur votre machine locale
ssh-copy-id -i kayniou.pem ec2-user@16.171.193.183
```

### Erreur: `pm2 command not found`

Installer PM2:
```bash
sudo npm install -g pm2
```

### Le serveur ne démarre pas

Vérifier les erreurs:
```bash
cd /home/ec2-user/kayniou-liguey/kayniou-liggey-backend
npm install  # Réinstaller dépendances
node src/index.js  # Tester en mode debug
```

### MongoDB connection error

Vérifier les variables d'environnement:
```bash
cat .env
# Doit contenir:
# MONGODB_URI=mongodb+srv://...
# PORT=5000
```

---

## 📚 Références

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [AWS EC2 SSH Connection](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html)
- [Git Pull Documentation](https://git-scm.com/docs/git-pull)

---

**Dernière mise à jour**: 2026-01-07
**Backend version**: Commit `5fa9d00` (avec worksite_status fix)
