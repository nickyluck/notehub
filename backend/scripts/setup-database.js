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

    // Diviser le SQL en requêtes individuelles (séparées par ;)
    // On filtre les lignes vides et les commentaires
    const queries = schemaSQL
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    console.log(`📝 ${queries.length} requêtes à exécuter\n`);

    // Exécuter chaque requête
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Ignorer les requêtes vides après nettoyage
      if (!query || query.length < 10) continue;

      try {
        // Extraire le nom de la table pour l'affichage
        const tableMatch = query.match(/CREATE TABLE.*?(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : 'requête';
        
        console.log(`[${i + 1}/${queries.length}] Exécution: ${tableName}...`);
        
        await pool.query(query);
        
        console.log(`  ✅ ${tableName} créé avec succès`);
        successCount++;
      } catch (error) {
        // Ignorer les erreurs "already exists" (IF NOT EXISTS)
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ⚠️  ${tableName} existe déjà (ignoré)`);
          successCount++;
        } else {
          console.error(`  ❌ Erreur: ${error.message}`);
          errorCount++;
        }
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

