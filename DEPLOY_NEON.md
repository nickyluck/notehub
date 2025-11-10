# Guide de déploiement avec Neon

## Configuration de Neon

### Étape 1 : Créer un compte et un projet Neon

1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte (gratuit)
3. Créez un nouveau projet :
   - Nom du projet : `notehub` (ou autre)
   - Région : choisissez la plus proche de vous
   - PostgreSQL version : 15 ou 16

### Étape 2 : Récupérer les informations de connexion

1. Dans le dashboard Neon, ouvrez votre projet
2. Allez dans l'onglet **"Connection Details"**
3. Vous verrez :
   - **Connection string** (format complet) - à utiliser de préférence
   - Ou les détails séparés : Host, Database, User, Password, Port

### Étape 3 : Créer les tables dans Neon

**Via l'interface Neon (recommandé) :**

1. Dans le dashboard Neon, ouvrez **"SQL Editor"**
2. Cliquez sur **"New Query"**
3. Copiez-collez tout le contenu du fichier `database/schema.sql`
4. Cliquez sur **"Run"** pour exécuter

**Via psql (en ligne de commande) :**

```bash
# Utiliser la connection string fournie par Neon
psql "postgresql://user:password@host.neon.tech/dbname?sslmode=require" -f database/schema.sql
```

### Étape 4 : Configurer les variables d'environnement

**Pour le développement local (`backend/.env`) :**

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi_123456789

# Option 1 : Utiliser la connection string complète (recommandé pour Neon)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Option 2 : Ou utiliser les variables séparées
# DB_HOST=xxx.neon.tech
# DB_PORT=5432
# DB_NAME=neondb
# DB_USER=neondb_owner
# DB_PASSWORD=votre_mot_de_passe
```

**Important :** Neon nécessite SSL, le code l'active automatiquement.

### Étape 5 : Tester la connexion localement

1. Assurez-vous que votre fichier `backend/.env` est configuré
2. Démarrez le backend :
```bash
cd backend
npm install
npm run dev
```

3. Vérifiez les logs pour confirmer la connexion à Neon

## Déploiement sur Vercel

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
```

### Étape 2 : Déployer le projet

```bash
# À la racine du projet
vercel
```

Suivez les instructions pour connecter votre projet.

### Étape 3 : Configurer les variables d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

   - **DATABASE_URL** : 
     - Value : La connection string complète de Neon
     - Environment : Production, Preview, Development (cochez toutes)
   
   - **JWT_SECRET** :
     - Value : Votre secret JWT (le même qu'en local)
     - Environment : Production, Preview, Development
   
   - **NODE_ENV** :
     - Value : `production`
     - Environment : Production

### Étape 4 : Configurer le frontend

1. Dans Vercel, ouvrez les **Environment Variables** de votre projet
2. Ajoutez :
   - **REACT_APP_API_URL** :
     - Value : `https://votre-projet.vercel.app/api`
     - Remplacez `votre-projet` par le nom réel de votre projet Vercel
     - Environment : Production, Preview, Development

### Étape 5 : Redéployer

Après avoir ajouté les variables d'environnement, redéployez :

```bash
vercel --prod
```

Ou depuis le dashboard Vercel, cliquez sur **"Redeploy"**.

## Vérification

1. Testez l'API : `https://votre-projet.vercel.app/api/health`
   - Devrait retourner : `{"status":"OK","message":"API fonctionnelle"}`

2. Testez l'inscription depuis le frontend
   - Créez un compte
   - Connectez-vous

## Points importants pour Neon

- ✅ **SSL requis** : Le code active automatiquement SSL pour Neon
- ✅ **Connection pooling** : Neon gère automatiquement le pooling
- ⚠️ **Timeout** : Neon peut suspendre les bases inactives (plan gratuit). La première requête peut être plus lente après une pause
- 📊 **Limite gratuite** : 512 MB de stockage, largement suffisant pour commencer

## Dépannage

### Erreur de connexion

1. Vérifiez que SSL est activé (`sslmode=require` dans la connection string)
2. Vérifiez que les variables d'environnement sont bien définies sur Vercel
3. Vérifiez que les tables existent dans Neon (SQL Editor → voir les tables)

### Erreur "relation does not exist"

Les tables n'ont pas été créées. Exécutez le schéma SQL dans Neon :
1. Ouvrez SQL Editor dans Neon
2. Copiez-collez le contenu de `database/schema.sql`
3. Exécutez la query

### Erreur CORS

Vérifiez que le frontend utilise la bonne URL API dans `REACT_APP_API_URL`.

### Base de données suspendue (Neon gratuit)

Si la base est inactive, Neon peut la suspendre. La première requête après la suspension peut prendre quelques secondes. C'est normal avec le plan gratuit.

## Migration depuis PostgreSQL local

Si vous avez déjà des données en local :

1. Exporter les données :
```bash
pg_dump -U postgres correcteur_db > backup.sql
```

2. Importer dans Neon :
   - Ouvrez SQL Editor dans Neon
   - Ou utilisez psql avec la connection string de Neon :
```bash
psql "postgresql://user:password@host.neon.tech/dbname?sslmode=require" < backup.sql
```

