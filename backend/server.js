const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/grids', require('./routes/grids'));
app.use('/api/grades', require('./routes/grades'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Servir les fichiers statiques du build React en production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  const fs = require('fs');
  
  // Essayer plusieurs chemins possibles pour le build
  const possiblePaths = [
    path.join(process.cwd(), 'build'),           // Depuis la racine (Vercel standard)
    path.join(__dirname, '../../build'),         // Depuis backend/
    path.join(__dirname, '../build'),           // Alternative
    path.join(__dirname, '../../.vercel/output/static'), // Vercel output
    '/var/task/build',                          // Vercel Lambda
    path.join(process.cwd(), '.vercel/output/static'), // Vercel output alternatif
  ];
  
  let buildPath = null;
  const testedPaths = [];
  
  for (const possiblePath of possiblePaths) {
    testedPaths.push(possiblePath);
    try {
      const indexPath = path.join(possiblePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        buildPath = possiblePath;
        console.log(`✅ Build trouvé à: ${buildPath}`);
        console.log(`📁 Répertoire de travail: ${process.cwd()}`);
        console.log(`📁 __dirname: ${__dirname}`);
        break;
      }
    } catch (error) {
      // Ignorer les erreurs de chemin
    }
  }
  
  if (buildPath) {
    app.use(express.static(buildPath, {
      maxAge: '1y',
      etag: true
    }));
    
    // Route catch-all : renvoyer index.html pour toutes les routes non-API
    // Cela permet à React Router de gérer le routage côté client
    app.get('*', (req, res) => {
      // Ne pas intercepter les routes API
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Route API non trouvée' });
      }
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('index.html non trouvé dans le build');
      }
    });
  } else {
    console.error('❌ Dossier build non trouvé!');
    console.error('📁 Chemins testés:', testedPaths);
    console.error('📁 process.cwd():', process.cwd());
    console.error('📁 __dirname:', __dirname);
    
    // Lister les fichiers dans le répertoire courant pour déboguer
    try {
      const files = fs.readdirSync(process.cwd());
      console.error('📋 Fichiers dans process.cwd():', files);
    } catch (e) {
      console.error('❌ Impossible de lire process.cwd()');
    }
    
    // Route de fallback avec message d'erreur détaillé
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.status(404).json({ 
          error: 'Build React non trouvé',
          message: 'Le dossier build n\'a pas été trouvé. Vérifiez que le buildCommand est exécuté correctement.',
          testedPaths: testedPaths,
          cwd: process.cwd(),
          dirname: __dirname
        });
      }
    });
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

