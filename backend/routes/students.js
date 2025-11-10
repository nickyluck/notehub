const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Tous les routes nécessitent l'authentification
router.use(authenticateToken);

// GET /api/students - Récupérer tous les étudiants
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, prenom, classe, presence FROM students WHERE user_id = $1 ORDER BY nom, prenom',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/students - Créer un étudiant
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, classe, presence } = req.body;
    const result = await pool.query(
      'INSERT INTO students (user_id, nom, prenom, classe, presence) VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, prenom, classe, presence',
      [req.user.userId, nom, prenom, classe, presence || 'present']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/students/:id - Modifier un étudiant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, classe, presence } = req.body;
    
    // Vérifier que l'étudiant appartient à l'utilisateur
    const check = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    const result = await pool.query(
      'UPDATE students SET nom = $1, prenom = $2, classe = $3, presence = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, nom, prenom, classe, presence',
      [nom, prenom, classe, presence, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/students/:id - Supprimer un étudiant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'étudiant appartient à l'utilisateur
    const check = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: 'Étudiant supprimé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

