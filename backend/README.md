# Backend API - Correcteur de Copies

## Prérequis

- Node.js (version 14 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm

## Installation

1. **Installer les dépendances**

```bash
cd backend
npm install
```

2. **Configurer PostgreSQL**

Créez une base de données PostgreSQL :

```bash
createdb correcteur_db
```

3. **Créer les tables**

Exécutez le script SQL pour créer la structure de la base de données :

```bash
psql correcteur_db < ../database/schema.sql
```

Ou depuis psql :

```sql
\i ../database/schema.sql
```

4. **Configurer les variables d'environnement**

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Puis modifiez `.env` avec vos paramètres :

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi_123456789
DB_HOST=localhost
DB_PORT=5432
DB_NAME=correcteur_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

**Important** : Changez `JWT_SECRET` par une chaîne aléatoire sécurisée !

## Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### Mode production

```bash
npm start
```

## API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Étudiants

- `GET /api/students` - Liste des étudiants
- `POST /api/students` - Créer un étudiant
- `PUT /api/students/:id` - Modifier un étudiant
- `DELETE /api/students/:id` - Supprimer un étudiant

### Grilles

- `GET /api/grids` - Liste des grilles
- `GET /api/grids/:id` - Détails d'une grille
- `POST /api/grids` - Créer une grille
- `PUT /api/grids/:id` - Modifier une grille
- `DELETE /api/grids/:id` - Supprimer une grille

### Notes

- `GET /api/grades/:gridId/:studentId` - Récupérer les notes
- `POST /api/grades/:gridId/:studentId` - Sauvegarder les notes

## Sécurité

- Toutes les routes (sauf `/api/auth/*`) nécessitent un token JWT
- Le token doit être envoyé dans le header : `Authorization: Bearer <token>`
- Les données sont isolées par utilisateur (user_id)

## Structure de la base de données

- `users` - Utilisateurs
- `students` - Étudiants
- `grids` - Grilles de correction
- `exercises` - Exercices
- `questions` - Questions
- `items` - Items d'évaluation
- `grades` - Notes
- `adjustments` - Ajustements (bonus/malus)
- `comments` - Commentaires

## Notes techniques

- Les IDs sont générés automatiquement par PostgreSQL (SERIAL)
- Les suppressions en cascade sont gérées par les contraintes FOREIGN KEY
- Les transactions sont utilisées pour garantir la cohérence des données

