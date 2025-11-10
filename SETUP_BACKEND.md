# Guide de configuration du backend

## Étapes d'installation complète

### 1. Installer PostgreSQL

**Windows :**
- Téléchargez depuis https://www.postgresql.org/download/windows/
- Installez avec les paramètres par défaut
- Notez le mot de passe du superutilisateur `postgres`

**Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS :**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE correcteur_db;

# Quitter psql
\q
```

### 3. Créer les tables

```bash
# Depuis le répertoire racine du projet
psql -U postgres -d correcteur_db -f database/schema.sql
```

### 4. Configurer le backend

```bash
cd backend
npm install
cp .env.example .env
```

Éditez le fichier `.env` avec vos paramètres :

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=changez_moi_par_une_chaine_aleatoire_securisee_123456789
DB_HOST=localhost
DB_PORT=5432
DB_NAME=correcteur_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
```

### 5. Démarrer le backend

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5000`

### 6. Configurer le frontend

Créez un fichier `.env` à la racine du projet frontend :

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Puis démarrez le frontend :

```bash
npm start
```

## Vérification

1. Ouvrez `http://localhost:5000/api/health` dans votre navigateur
   - Vous devriez voir : `{"status":"OK","message":"API fonctionnelle"}`

2. Testez l'inscription depuis le frontend
   - Créez un compte
   - Connectez-vous

## Dépannage

### Erreur de connexion à la base de données

- Vérifiez que PostgreSQL est démarré
- Vérifiez les identifiants dans `.env`
- Testez la connexion : `psql -U postgres -d correcteur_db`

### Erreur "relation does not exist"

- Les tables n'ont pas été créées
- Exécutez à nouveau : `psql -U postgres -d correcteur_db -f database/schema.sql`

### Erreur CORS

- Vérifiez que le frontend utilise la bonne URL API
- Le backend doit être démarré avant le frontend

