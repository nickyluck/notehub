# Script de configuration automatique de la base de données

Ce script permet de créer automatiquement toutes les tables dans votre base de données Neon sans passer par l'interface web.

## Utilisation

### 1. Configurer les variables d'environnement

Créez ou modifiez le fichier `backend/.env` :

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi_123456789

# Option 1 : Connection string complète (recommandé)
POSTGRES_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
# ou
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Option 2 : Variables séparées
# DB_HOST=xxx.neon.tech
# DB_PORT=5432
# DB_NAME=neondb
# DB_USER=neondb_owner
# DB_PASSWORD=votre_mot_de_passe
```

**Pour Vercel :** Copiez la `POSTGRES_URL` depuis Vercel → Settings → Environment Variables

### 2. Exécuter le script

```bash
cd backend
npm run setup-db
```

Le script va :
- ✅ Se connecter à la base de données
- ✅ Lire le fichier `database/schema.sql`
- ✅ Créer toutes les tables automatiquement
- ✅ Afficher un résumé des tables créées

### 3. Exemple de sortie

```
🚀 Démarrage de la configuration de la base de données...

📖 Lecture du fichier: D:\...\database\schema.sql
✅ Fichier schema.sql lu avec succès

🔌 Test de connexion à la base de données...
✅ Connexion réussie!

📝 8 requêtes à exécuter

[1/8] Exécution: students...
  ✅ students créé avec succès
...

==================================================
📊 Résumé:
   ✅ Succès: 8
==================================================

🔍 Vérification des tables créées...

📋 Tables trouvées (8):
   - adjustments
   - comments
   - exercises
   - grades
   - grids
   - items
   - questions
   - students

✅ Configuration de la base de données terminée avec succès!

🔌 Connexion fermée
```

## Utilisation avec Vercel (production)

### Option 1 : Via Vercel CLI

1. Installez Vercel CLI :
```bash
npm install -g vercel
```

2. Connectez-vous :
```bash
vercel login
```

3. Récupérez les variables d'environnement :
```bash
vercel env pull .env.local
```

4. Exécutez le script :
```bash
cd backend
POSTGRES_URL=$(grep POSTGRES_URL ../.env.local | cut -d '=' -f2) npm run setup-db
```

### Option 2 : Via un script temporaire

Créez un fichier `setup-vercel-db.js` à la racine :

```javascript
require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

execSync('cd backend && npm run setup-db', { 
  stdio: 'inherit',
  env: { ...process.env }
});
```

Puis :
```bash
vercel env pull .env.local
node setup-vercel-db.js
```

## Dépannage

### Erreur "ECONNREFUSED"

- Vérifiez que `POSTGRES_URL` ou `DATABASE_URL` est correctement défini
- Vérifiez que la connection string contient `?sslmode=require`
- Testez la connexion : `psql "$POSTGRES_URL"`

### Erreur "relation already exists"

C'est normal ! Le script ignore ces erreurs car les tables existent déjà.

### Erreur "schema.sql not found"

Assurez-vous d'exécuter le script depuis le répertoire `backend/` :
```bash
cd backend
npm run setup-db
```

### Tables partiellement créées

Si le script s'arrête en cours, vous pouvez le relancer. Il ignorera les tables déjà créées.

## Avantages

✅ **Pas besoin d'interface web** : Fonctionne même si Neon rame  
✅ **Rapide** : Crée toutes les tables en quelques secondes  
✅ **Fiable** : Gère les erreurs et affiche un résumé clair  
✅ **Réutilisable** : Peut être exécuté plusieurs fois sans problème  
✅ **Portable** : Fonctionne en local et avec Vercel  

## Vérification manuelle (optionnel)

Pour vérifier que tout fonctionne, vous pouvez exécuter cette requête :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir 8 tables : `students`, `grids`, `exercises`, `questions`, `items`, `grades`, `adjustments`, `comments`.

