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
  // Essayer plusieurs chemins possibles pour le build
  const possiblePaths = [
    path.join(__dirname, '../../build'),  // Depuis backend/
    path.join(__dirname, '../build'),     // Alternative
    path.join(process.cwd(), 'build'),    // Depuis la racine du projet
    path.join(__dirname, '../../.vercel/output/static'), // Vercel output
  ];
  
  let buildPath = null;
  const fs = require('fs');
  
  for (const possiblePath of possiblePaths) {
    const indexPath = path.join(possiblePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      buildPath = possiblePath;
      console.log(`✅ Build trouvé à: ${buildPath}`);
      break;
    }
  }
  
  if (buildPath) {
    app.use(express.static(buildPath));
    
    // Route catch-all : renvoyer index.html pour toutes les routes non-API
    // Cela permet à React Router de gérer le routage côté client
    app.get('*', (req, res) => {
      // Ne pas intercepter les routes API
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Route API non trouvée' });
      }
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  Dossier build non trouvé. Chemins testés:', possiblePaths);
    // Route de fallback
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.status(404).send('Build React non trouvé. Vérifiez la configuration Vercel.');
      }
    });
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

