const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

// GET /api/grades/:gridId/:studentId - Récupérer les notes d'un étudiant pour une grille
router.get('/:gridId/:studentId', async (req, res) => {
  try {
    const { gridId, studentId } = req.params;

    // Vérifier que la grille et l'étudiant appartiennent à l'utilisateur
    const gridCheck = await pool.query(
      'SELECT id FROM grids WHERE id = $1 AND user_id = $2',
      [gridId, req.user.userId]
    );
    const studentCheck = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, req.user.userId]
    );

    if (gridCheck.rows.length === 0 || studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Grille ou étudiant non trouvé' });
    }

    // Récupérer les notes
    const gradesResult = await pool.query(
      `SELECT exercise_id, question_id, item_id, value, custom_mode 
       FROM grades 
       WHERE grid_id = $1 AND student_id = $2 AND user_id = $3`,
      [gridId, studentId, req.user.userId]
    );

    // Récupérer les ajustements
    const adjustmentsResult = await pool.query(
      `SELECT exercise_id, adjustment_type, value 
       FROM adjustments 
       WHERE grid_id = $1 AND student_id = $2 AND user_id = $3`,
      [gridId, studentId, req.user.userId]
    );

    // Récupérer le commentaire
    const commentResult = await pool.query(
      `SELECT comment FROM comments 
       WHERE grid_id = $1 AND student_id = $2 AND user_id = $3`,
      [gridId, studentId, req.user.userId]
    );

    // Formater les données comme dans localStorage
    const grades = {};
    gradesResult.rows.forEach(row => {
      const key = `${row.exercise_id}_${row.question_id}_${row.item_id}`;
      grades[key] = {
        value: row.value !== null ? (isNaN(row.value) ? row.value : parseFloat(row.value)) : null,
        customMode: row.custom_mode
      };
    });

    const adjustments = {};
    adjustmentsResult.rows.forEach(row => {
      if (row.adjustment_type === 'global') {
        adjustments.global = parseFloat(row.value);
      } else {
        adjustments[row.exercise_id] = parseFloat(row.value);
      }
    });

    res.json({
      grades,
      adjustments,
      comment: commentResult.rows[0]?.comment || ''
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/grades/:gridId/:studentId - Sauvegarder les notes
router.post('/:gridId/:studentId', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { gridId, studentId } = req.params;
    const { grades, adjustments, comment } = req.body;

    // Vérifier que la grille et l'étudiant appartiennent à l'utilisateur
    const gridCheck = await client.query(
      'SELECT id FROM grids WHERE id = $1 AND user_id = $2',
      [gridId, req.user.userId]
    );
    const studentCheck = await client.query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, req.user.userId]
    );

    if (gridCheck.rows.length === 0 || studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Grille ou étudiant non trouvé' });
    }

    // Supprimer les anciennes notes
    await client.query(
      'DELETE FROM grades WHERE grid_id = $1 AND student_id = $2 AND user_id = $3',
      [gridId, studentId, req.user.userId]
    );

    // Insérer les nouvelles notes
    for (const [key, gradeData] of Object.entries(grades || {})) {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const exerciseId = parseInt(parts[0]);
        const questionId = parseInt(parts[1]);
        const itemId = parseInt(parts[2]);

        await client.query(
          `INSERT INTO grades (user_id, grid_id, student_id, exercise_id, question_id, item_id, value, custom_mode)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (grid_id, student_id, item_id) 
           DO UPDATE SET value = $7, custom_mode = $8, updated_at = CURRENT_TIMESTAMP`,
          [
            req.user.userId,
            gridId,
            studentId,
            exerciseId,
            questionId,
            itemId,
            gradeData.value !== null && gradeData.value !== undefined ? String(gradeData.value) : null,
            gradeData.customMode || null
          ]
        );
      }
    }

    // Supprimer les anciens ajustements
    await client.query(
      'DELETE FROM adjustments WHERE grid_id = $1 AND student_id = $2 AND user_id = $3',
      [gridId, studentId, req.user.userId]
    );

    // Insérer les nouveaux ajustements
    for (const [key, value] of Object.entries(adjustments || {})) {
      const adjustmentType = key === 'global' ? 'global' : 'exercise';
      const exerciseId = key === 'global' ? null : parseInt(key);

      await client.query(
        `INSERT INTO adjustments (user_id, grid_id, student_id, exercise_id, adjustment_type, value)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.userId, gridId, studentId, exerciseId, adjustmentType, parseFloat(value)]
      );
    }

    // Gérer le commentaire
    await client.query(
      `INSERT INTO comments (user_id, grid_id, student_id, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (grid_id, student_id)
       DO UPDATE SET comment = $4, updated_at = CURRENT_TIMESTAMP`,
      [req.user.userId, gridId, studentId, comment || '']
    );

    await client.query('COMMIT');
    res.json({ message: 'Notes sauvegardées' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;

