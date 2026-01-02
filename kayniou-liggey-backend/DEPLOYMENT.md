# Déploiement Kayniou Liggey Backend

## Configuration MongoDB Atlas

La base de données est hébergée sur MongoDB Atlas.

### Chaîne de connexion
Utilisez le format suivant (remplacez les valeurs par vos credentials):
```
mongodb+srv://<username>:<password>@<cluster-url>/kayniou-liggey?retryWrites=true&w=majority&appName=Cluster0
```

## Variables d'environnement pour production

⚠️ **IMPORTANT**: Ces valeurs sont des exemples. Utilisez vos propres credentials sécurisés!

Pour déployer sur AWS/Render/Heroku, configure ces variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/kayniou-liggey?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<votre_secret_jwt_unique>
JWT_EXPIRE=30d
FRONTEND_URL=https://votre-app-frontend-url.com
NODE_ENV=production
GROQ_API_KEY=<votre_cle_api_groq>
```

### Obtenir vos credentials

1. **MongoDB Atlas**:
   - Connectez-vous sur https://cloud.mongodb.com/
   - Cliquez sur "Connect" → "Connect your application"
   - Copiez la chaîne de connexion

2. **GROQ API Key**:
   - Inscrivez-vous sur https://console.groq.com/
   - Créez une nouvelle clé API
   - Copiez la clé (commence par `gsk_`)

3. **JWT Secret**:
   - Générez une chaîne aléatoire sécurisée
   - Exemple: `openssl rand -base64 32`

## Test de connexion

```bash
npm install
npm start
```

Vous devriez voir:
```
✅ MongoDB Connected: ac-5mw5j9u-shard-00-00.x51fq6l.mongodb.net
🚀 Serveur démarré sur le port 5000
```

## Déploiement

### AWS / EC2
1. Créer une instance EC2
2. Installer Node.js 18+
3. Cloner le repository
4. Configurer les variables d'environnement
5. Installer les dépendances: `npm install`
6. Utiliser PM2 pour le process management: `pm2 start server.js`

### Render
1. Connecter le repository GitHub
2. Configurer les variables d'environnement dans le dashboard
3. Build command: `npm install`
4. Start command: `npm start`

### Heroku
1. Créer une app Heroku
2. Configurer les variables d'environnement: `heroku config:set ...`
3. Déployer: `git push heroku main`

## Notes importantes

- MongoDB Atlas est déjà configuré avec IP whitelist (0.0.0.0/0 pour accepter toutes les connexions)
- Le cluster est en région US-East-1
- Free tier avec 512 MB de stockage
- Connexion testée et fonctionnelle ✅
