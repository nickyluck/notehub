const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ignorer les requêtes pour favicon.ico pour éviter les erreurs 404
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/grids', require('./routes/grids'));
app.use('/api/grades', require('./routes/grades'));

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Sur Vercel, les fichiers statiques et index.html sont servis directement par Vercel via vercel.json
// Le serveur Node.js ne sert que les routes API
// Aucune route catch-all nécessaire sur Vercel car vercel.json gère tout
if (!process.env.VERCEL && process.env.NODE_ENV === 'production') {
  // En production locale, servir les fichiers statiques
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(process.cwd(), 'build'),
    path.join(__dirname, '../../build'),
    path.join(__dirname, '../build'),
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
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

