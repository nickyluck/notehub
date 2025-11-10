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

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Servir les fichiers statiques du build React en production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  const fs = require('fs');
  
  // Chemins possibles pour le build
  const possiblePaths = [
    path.join(process.cwd(), 'build'),
    path.join(__dirname, '../../build'),
    path.join(__dirname, '../build'),
    path.join(__dirname, '../../.vercel/output/static'),
    '/var/task/build',
    path.join(process.cwd(), '.vercel/output/static'),
  ];
  
  let buildPath = null;
  
  for (const possiblePath of possiblePaths) {
    try {
      const indexPath = path.join(possiblePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        buildPath = possiblePath;
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
    app.get('*', (req, res) => {
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
    console.error('Erreur: Dossier build non trouvé');
    
    // Route de fallback
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.status(404).json({ 
          error: 'Build React non trouvé',
          message: 'Le dossier build n\'a pas été trouvé. Vérifiez que le buildCommand est exécuté correctement.'
        });
      }
    });
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

