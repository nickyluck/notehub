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
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../build');
  app.use(express.static(buildPath));
  
  // Route catch-all : renvoyer index.html pour toutes les routes non-API
  // Cela permet à React Router de gérer le routage côté client
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

