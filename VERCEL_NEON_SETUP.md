# Configuration Neon depuis Vercel

## Si vous avez créé Neon depuis Vercel

Quand vous créez une base de données Neon directement depuis Vercel, les variables d'environnement sont automatiquement configurées. Voici comment vérifier et compléter la configuration.

## Étape 1 : Vérifier les variables d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Vous devriez voir une variable automatiquement créée :
   - `POSTGRES_URL` (ou parfois `DATABASE_URL`)
   - Cette variable contient la connection string complète

**Note :** Le code a été mis à jour pour supporter `POSTGRES_URL` et `DATABASE_URL`.

## Étape 2 : Ajouter les autres variables nécessaires

Ajoutez ces variables d'environnement sur Vercel :

1. **JWT_SECRET** :
   - Value : Une chaîne aléatoire sécurisée (ex: `votre_secret_jwt_tres_securise_123456789`)
   - Environment : Production, Preview, Development (cochez toutes)

2. **NODE_ENV** :
   - Value : `production`
   - Environment : Production uniquement

3. **REACT_APP_API_URL** (pour le frontend) :
   - Value : `https://votre-projet.vercel.app/api`
   - Remplacez `votre-projet` par le nom réel de votre projet
   - Environment : Production, Preview, Development

## Étape 3 : Créer les tables dans Neon

### Option A : Via le script automatique (RECOMMANDÉ - Plus rapide)

1. Récupérez votre `POSTGRES_URL` depuis Vercel :
   - Allez dans **Settings** → **Environment Variables**
   - Copiez la valeur de `POSTGRES_URL`

2. Créez un fichier `backend/.env` local :
```env
POSTGRES_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

3. Exécutez le script :
```bash
cd backend
npm install
npm run setup-db
```

Le script créera automatiquement toutes les tables ! Consultez `SETUP_DATABASE.md` pour plus de détails.

### Option B : Via le dashboard Neon

1. Dans Vercel, allez dans **Storage** (ou **Integrations**)
2. Cliquez sur votre base de données Neon
3. Cliquez sur **"Open in Neon"** ou **"Manage"**
4. Cela vous redirige vers le dashboard Neon
5. Dans Neon, allez dans **SQL Editor**
6. Cliquez sur **"New Query"**
7. Copiez-collez tout le contenu du fichier `database/schema.sql`
8. Cliquez sur **"Run"** pour exécuter

### Option B : Via Vercel CLI (si vous avez accès)

```bash
# Se connecter à la base via psql
# Récupérez la connection string depuis Vercel
psql "$POSTGRES_URL" -f database/schema.sql
```

### Option C : Via l'interface Vercel

1. Dans Vercel, allez dans **Storage**
2. Cliquez sur votre base Neon
3. Cherchez une option **"SQL Editor"** ou **"Query"**
4. Si disponible, exécutez le contenu de `database/schema.sql`

## Étape 4 : Tester la connexion

### Test local

1. Créez un fichier `backend/.env` :
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi_123456789

# Copiez la POSTGRES_URL depuis Vercel
POSTGRES_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

2. Testez localement :
```bash
cd backend
npm install
npm run dev
```

3. Vérifiez les logs pour confirmer la connexion

### Test sur Vercel

1. Redéployez votre projet :
```bash
vercel --prod
```

2. Testez l'endpoint :
```
https://votre-projet.vercel.app/api/health
```

Devrait retourner : `{"status":"OK","message":"API fonctionnelle"}`

## Étape 5 : Vérifier que les tables existent

### Via Neon Dashboard

1. Ouvrez votre base Neon depuis Vercel
2. Allez dans **SQL Editor**
3. Exécutez cette query :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Vous devriez voir toutes les tables : `users`, `students`, `grids`, `exercises`, `questions`, `items`, `grades`, `adjustments`, `comments`

## Dépannage

### Erreur "relation does not exist"

**Solution :** Les tables n'ont pas été créées. Suivez l'Étape 3 pour créer les tables.

### Erreur de connexion

1. Vérifiez que `POSTGRES_URL` est bien défini dans Vercel
2. Vérifiez que la connection string contient `?sslmode=require`
3. Vérifiez les logs Vercel pour plus de détails

### Comment accéder au dashboard Neon depuis Vercel

1. Dans Vercel, allez dans **Storage** (ou **Integrations**)
2. Trouvez votre base de données Neon
3. Cliquez dessus
4. Cherchez un bouton **"Open in Neon"**, **"Manage"**, ou **"Dashboard"**
5. Si vous ne trouvez pas, allez directement sur [neon.tech](https://neon.tech) et connectez-vous avec le même compte

### Variables d'environnement manquantes

Si `POSTGRES_URL` n'apparaît pas automatiquement :

1. Dans Vercel, allez dans **Storage**
2. Cliquez sur votre base Neon
3. Cherchez un bouton **"Connect"** ou **"View Connection String"**
4. Copiez la connection string
5. Ajoutez-la manuellement dans **Settings** → **Environment Variables** comme `POSTGRES_URL`

## Vérification finale

Une fois tout configuré :

1. ✅ Les variables d'environnement sont définies sur Vercel
2. ✅ Les tables sont créées dans Neon
3. ✅ L'API répond sur `/api/health`
4. ✅ Vous pouvez vous inscrire depuis le frontend

Si tout fonctionne, votre application est prête !

