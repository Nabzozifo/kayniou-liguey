# Kayniou Liggey Backend

Backend Node.js/Express pour l'application mobile Kayniou Liggey - plateforme de mise en relation entre clients et travailleurs au Sénégal.

## Technologies

- Node.js & Express
- MongoDB Atlas
- Socket.IO (temps réel)
- JWT (authentification)
- GROQ AI (NLP & chatbot)

## Installation

1. Cloner le repository
```bash
git clone <repo-url>
cd kayniou-liggey-backend
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Puis éditer `.env` avec vos propres valeurs.

4. Démarrer le serveur
```bash
npm start
```

## Variables d'environnement

- `PORT`: Port du serveur (défaut: 5000)
- `MONGODB_URI`: URL de connexion MongoDB Atlas
- `JWT_SECRET`: Clé secrète pour JWT
- `JWT_EXPIRE`: Durée de validité du token
- `FRONTEND_URL`: URL du frontend
- `NODE_ENV`: Environnement (development/production)
- `GROQ_API_KEY`: Clé API GROQ pour IA

## Déploiement

### AWS / Render / Heroku

1. Configurer les variables d'environnement sur la plateforme
2. Déployer le code
3. La base de données MongoDB Atlas est déjà configurée

## Structure

```
src/
├── controllers/    # Logique métier
├── models/        # Modèles MongoDB
├── routes/        # Routes API
├── services/      # Services (NLP, notifications)
└── middleware/    # Middleware (auth, etc.)
```

## API Endpoints

- `/api/auth` - Authentification
- `/api/users` - Gestion utilisateurs
- `/api/service-requests` - Demandes de service
- `/api/quotes` - Devis
- `/api/worksites` - Chantiers
- `/api/chat` - Messagerie
- `/api/ratings` - Évaluations
- `/api/notifications` - Notifications
