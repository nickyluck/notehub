const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// Fonction helper pour récupérer une grille complète
const getFullGrid = async (gridId) => {
  const gridResult = await pool.query(
    'SELECT id, titre, classe FROM grids WHERE id = $1',
    [gridId]
  );

  if (gridResult.rows.length === 0) return null;

  const grid = gridResult.rows[0];

  // Récupérer les exercices
  const exercisesResult = await pool.query(
    'SELECT id, nom, points, order_index FROM exercises WHERE grid_id = $1 ORDER BY order_index',
    [gridId]
  );

  const exercises = await Promise.all(
    exercisesResult.rows.map(async (exercise) => {
      // Récupérer les questions
      const questionsResult = await pool.query(
        'SELECT id, libelle, points, order_index FROM questions WHERE exercise_id = $1 ORDER BY order_index',
        [exercise.id]
      );

      const questions = await Promise.all(
        questionsResult.rows.map(async (question) => {
          // Récupérer les items
          const itemsResult = await pool.query(
            'SELECT id, intitule, points, mode, steps, order_index FROM items WHERE question_id = $1 ORDER BY order_index',
            [question.id]
          );

          return {
            id: question.id.toString(),
            libelle: question.libelle,
            points: question.points,
            items: itemsResult.rows.map(item => ({
              id: item.id.toString(),
              intitule: item.intitule,
              points: parseFloat(item.points),
              mode: item.mode,
              steps: item.steps
            }))
          };
        })
      );

      return {
        id: exercise.id.toString(),
        nom: exercise.nom,
        points: exercise.points,
        questions
      };
    })
  );

  return {
    id: grid.id.toString(),
    titre: grid.titre,
    classe: grid.classe,
    exercises
  };
};

// GET /api/grids - Récupérer toutes les grilles avec leur structure complète
router.get('/', async (req, res) => {
  try {
    const gridsResult = await pool.query(
      'SELECT id FROM grids ORDER BY created_at DESC'
    );

    const grids = await Promise.all(
      gridsResult.rows.map(grid => getFullGrid(grid.id))
    );

    res.json(grids);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/grids/:id - Récupérer une grille spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query(
      'SELECT id FROM grids WHERE id = $1',
      [id]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Grille non trouvée' });
    }

    const grid = await getFullGrid(id);
    res.json(grid);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/grids - Créer une grille complète
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { titre, classe, exercises } = req.body;

    // Créer la grille
    const gridResult = await client.query(
      'INSERT INTO grids (titre, classe) VALUES ($1, $2) RETURNING id',
      [titre, classe]
    );
    const gridId = gridResult.rows[0].id;

    // Créer les exercices, questions et items
    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex];
      const exerciseResult = await client.query(
        'INSERT INTO exercises (grid_id, nom, points, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
        [gridId, exercise.nom, exercise.points || 'auto', exIndex]
      );
      const exerciseId = exerciseResult.rows[0].id;

      for (let qIndex = 0; qIndex < exercise.questions.length; qIndex++) {
        const question = exercise.questions[qIndex];
        const questionResult = await client.query(
          'INSERT INTO questions (exercise_id, libelle, points, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
          [exerciseId, question.libelle, question.points || 'auto', qIndex]
        );
        const questionId = questionResult.rows[0].id;

        for (let iIndex = 0; iIndex < question.items.length; iIndex++) {
          const item = question.items[iIndex];
          await client.query(
            'INSERT INTO items (question_id, intitule, points, mode, steps, order_index) VALUES ($1, $2, $3, $4, $5, $6)',
            [questionId, item.intitule, item.points, item.mode, item.steps || null, iIndex]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    // Récupérer la grille complète
    const fullGrid = await getFullGrid(gridId);
    res.status(201).json(fullGrid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/grids/:id - Modifier une grille
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { titre, classe, exercises } = req.body;

    // Vérifier que la grille existe
    const check = await client.query(
      'SELECT id FROM grids WHERE id = $1',
      [id]
    );
    
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Grille non trouvée' });
    }

    // Mettre à jour la grille
    await client.query(
      'UPDATE grids SET titre = $1, classe = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [titre, classe, id]
    );

    // Supprimer l'ancienne structure (cascade supprimera automatiquement)
    await client.query('DELETE FROM exercises WHERE grid_id = $1', [id]);

    // Recréer la structure
    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex];
      const exerciseResult = await client.query(
        'INSERT INTO exercises (grid_id, nom, points, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
        [id, exercise.nom, exercise.points || 'auto', exIndex]
      );
      const exerciseId = exerciseResult.rows[0].id;

      for (let qIndex = 0; qIndex < exercise.questions.length; qIndex++) {
        const question = exercise.questions[qIndex];
        const questionResult = await client.query(
          'INSERT INTO questions (exercise_id, libelle, points, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
          [exerciseId, question.libelle, question.points || 'auto', qIndex]
        );
        const questionId = questionResult.rows[0].id;

        for (let iIndex = 0; iIndex < question.items.length; iIndex++) {
          const item = question.items[iIndex];
          await client.query(
            'INSERT INTO items (question_id, intitule, points, mode, steps, order_index) VALUES ($1, $2, $3, $4, $5, $6)',
            [questionId, item.intitule, item.points, item.mode, item.steps || null, iIndex]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    const fullGrid = await getFullGrid(id);
    res.json(fullGrid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// DELETE /api/grids/:id - Supprimer une grille
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query(
      'SELECT id FROM grids WHERE id = $1',
      [id]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Grille non trouvée' });
    }

    await pool.query('DELETE FROM grids WHERE id = $1', [id]);
    res.json({ message: 'Grille supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

