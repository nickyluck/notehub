const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function setupDatabase() {
  console.log('🚀 Démarrage de la configuration de la base de données...\n');

  try {
    // Lire le fichier schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    console.log(`📖 Lecture du fichier: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Le fichier schema.sql n'existe pas à: ${schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Fichier schema.sql lu avec succès\n');

    // Tester la connexion
    console.log('🔌 Test de connexion à la base de données...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connexion réussie!\n');

    // Nettoyer le SQL : supprimer les commentaires de ligne
    const lines = schemaSQL.split('\n');
    const cleanedLines = lines.map(line => {
      // Supprimer les commentaires de ligne (-- commentaire)
      const commentIndex = line.indexOf('--');
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex).trim();
      }
      return line.trim();
    });

    // Reconstruire le SQL nettoyé
    const cleanedSQL = cleanedLines.join('\n');

    // Parser les requêtes SQL de manière plus robuste
    // On cherche les points-virgules qui terminent réellement une requête
    const queries = [];
    let currentQuery = '';
    let inString = false;
    let stringChar = null;

    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      const nextChar = cleanedSQL[i + 1];

      // Gérer les chaînes de caractères
      if ((char === '"' || char === "'") && (i === 0 || cleanedSQL[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }

      currentQuery += char;

      // Si on trouve un point-virgule et qu'on n'est pas dans une chaîne
      if (char === ';' && !inString) {
        const trimmed = currentQuery.trim();
        if (trimmed.length > 10) {
          queries.push(trimmed);
        }
        currentQuery = '';
      }
    }

    // Ajouter la dernière requête si elle existe
    if (currentQuery.trim().length > 10) {
      queries.push(currentQuery.trim());
    }

    // Séparer les CREATE TABLE et CREATE INDEX pour garantir l'ordre d'exécution
    const tableQueries = [];
    const indexQueries = [];

    queries.forEach(query => {
      if (query.match(/CREATE\s+TABLE/i)) {
        tableQueries.push(query);
      } else if (query.match(/CREATE\s+INDEX/i)) {
        indexQueries.push(query);
      }
    });

    console.log(`📝 ${tableQueries.length} tables et ${indexQueries.length} index à créer\n`);

    // Fonction pour exécuter une requête
    const executeQuery = async (query, index, total, type) => {
      let objectName = 'requête';
      if (type === 'table') {
        const tableMatch = query.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (tableMatch) {
          objectName = `table ${tableMatch[1]}`;
        }
      } else if (type === 'index') {
        const indexMatch = query.match(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)/i);
        if (indexMatch) {
          objectName = `index ${indexMatch[1]} sur ${indexMatch[2]}`;
        }
      }

      console.log(`[${index + 1}/${total}] Exécution: ${objectName}...`);

      try {
        // La requête devrait déjà avoir un point-virgule, mais on s'assure
        const queryToExecute = query.endsWith(';') ? query : query + ';';
        await pool.query(queryToExecute);
        console.log(`  ✅ ${objectName} créé avec succès`);
        return { success: true, objectName };
      } catch (error) {
        // Ignorer les erreurs "already exists" (IF NOT EXISTS)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('relation') && error.message.includes('already exists'))) {
          console.log(`  ⚠️  ${objectName} existe déjà (ignoré)`);
          return { success: true, objectName };
        } else {
          console.error(`  ❌ Erreur: ${error.message}`);
          const queryPreview = query.substring(0, 100) + (query.length > 100 ? '...' : '');
          console.error(`  📄 Requête: ${queryPreview}`);
          return { success: false, objectName, error: error.message };
        }
      }
    };

    // Exécuter d'abord toutes les tables
    let successCount = 0;
    let errorCount = 0;

    console.log('📊 Création des tables...\n');
    for (let i = 0; i < tableQueries.length; i++) {
      const result = await executeQuery(tableQueries[i], i, tableQueries.length, 'table');
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Ensuite, exécuter tous les index
    console.log('\n📊 Création des index...\n');
    for (let i = 0; i < indexQueries.length; i++) {
      const result = await executeQuery(indexQueries[i], i, indexQueries.length, 'index');
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Résumé:');
    console.log(`   ✅ Succès: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Erreurs: ${errorCount}`);
    }
    console.log('='.repeat(50) + '\n');

    // Vérifier que les tables existent
    console.log('🔍 Vérification des tables créées...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`\n📋 Tables trouvées (${tables.length}):`);
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });

    console.log('\n✅ Configuration de la base de données terminée avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la configuration:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Vérifiez que:');
      console.error('   1. Les variables d\'environnement sont correctement configurées');
      console.error('   2. La base de données est accessible');
      console.error('   3. Les identifiants de connexion sont corrects');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le script
setupDatabase();

