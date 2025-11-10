import React, { useState, useEffect } from 'react';
import { gridsAPI } from '../utils/api';
import './GridsPage.css';

const GridsPage = () => {
  const [grids, setGrids] = useState([]);
  const [selectedGridId, setSelectedGridId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGrids();
  }, []);

  const loadGrids = async () => {
    try {
      setLoading(true);
      const data = await gridsAPI.getAll();
      setGrids(data);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors du chargement: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const createNewGrid = async () => {
    const newGrid = {
      titre: 'Nouvelle grille',
      classe: '',
      exercises: [{
        nom: 'Exercice 1',
        points: 'auto',
        questions: [{
          libelle: 'Question 1',
          points: 'auto',
          items: [{
            intitule: 'Item 1',
            points: 1,
            mode: 'checkbox',
            steps: 4
          }]
        }]
      }]
    };
    try {
      setLoading(true);
      const created = await gridsAPI.create(newGrid);
      await loadGrids();
      setSelectedGridId(created.id);
      setActiveTab(0);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteGrid = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette grille ?')) {
      try {
        setLoading(true);
        await gridsAPI.delete(id);
        if (selectedGridId === id) {
          setSelectedGridId(null);
        }
        setMessage({ type: 'success', text: 'Grille supprimée' });
        await loadGrids();
      } catch (error) {
        setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const selectedGrid = grids.find(g => g.id === selectedGridId);

  const updateGrid = async (updates) => {
    if (!selectedGridId) return;
    try {
      setLoading(true);
      const updatedGrid = { ...selectedGrid, ...updates };
      await gridsAPI.update(selectedGridId, updatedGrid);
      await loadGrids();
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    if (!selectedGrid) return;
    const newExercise = {
      id: generateId(),
      nom: `Exercice ${selectedGrid.exercises.length + 1}`,
      points: 'auto',
      questions: [{
        id: generateId(),
        libelle: 'Question 1',
        points: 'auto',
        items: [{
          id: generateId(),
          intitule: 'Item 1',
          points: 1,
          mode: 'checkbox',
          steps: 4
        }]
      }]
    };
    updateGrid({
      exercises: [...selectedGrid.exercises, newExercise]
    });
    setActiveTab(selectedGrid.exercises.length);
  };

  const updateExercise = (exerciseId, updates) => {
    if (!selectedGrid) return;
    const updatedExercises = selectedGrid.exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    );
    updateGrid({ exercises: updatedExercises });
  };

  const deleteExercise = (exerciseId) => {
    if (!selectedGrid) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      const updatedExercises = selectedGrid.exercises.filter(ex => ex.id !== exerciseId);
      updateGrid({ exercises: updatedExercises });
      if (activeTab >= updatedExercises.length) {
        setActiveTab(Math.max(0, updatedExercises.length - 1));
      }
    }
  };

  const addQuestion = (exerciseId) => {
    if (!selectedGrid) return;
    const exercise = selectedGrid.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    const newQuestion = {
      id: generateId(),
      libelle: `Question ${exercise.questions.length + 1}`,
      points: 'auto',
      items: [{
        id: generateId(),
        intitule: 'Item 1',
        points: 1,
        mode: 'checkbox',
        steps: 4
      }]
    };
    
    const updatedExercises = selectedGrid.exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, questions: [...ex.questions, newQuestion] }
        : ex
    );
    updateGrid({ exercises: updatedExercises });
  };

  const updateQuestion = (exerciseId, questionId, updates) => {
    if (!selectedGrid) return;
    const updatedExercises = selectedGrid.exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            questions: ex.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            )
          }
        : ex
    );
    updateGrid({ exercises: updatedExercises });
  };

  const deleteQuestion = (exerciseId, questionId) => {
    if (!selectedGrid) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      const updatedExercises = selectedGrid.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, questions: ex.questions.filter(q => q.id !== questionId) }
          : ex
      );
      updateGrid({ exercises: updatedExercises });
    }
  };

  const addItem = (exerciseId, questionId) => {
    if (!selectedGrid) return;
    const exercise = selectedGrid.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const question = exercise.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newItem = {
      id: generateId(),
      intitule: `Item ${question.items.length + 1}`,
      points: 1,
      mode: 'checkbox',
      steps: 4
    };
    
    const updatedExercises = selectedGrid.exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            questions: ex.questions.map(q =>
              q.id === questionId
                ? { ...q, items: [...q.items, newItem] }
                : q
            )
          }
        : ex
    );
    updateGrid({ exercises: updatedExercises });
  };

  const updateItem = (exerciseId, questionId, itemId, updates) => {
    if (!selectedGrid) return;
    const updatedExercises = selectedGrid.exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            questions: ex.questions.map(q =>
              q.id === questionId
                ? {
                    ...q,
                    items: q.items.map(item =>
                      item.id === itemId ? { ...item, ...updates } : item
                    )
                  }
                : q
            )
          }
        : ex
    );
    updateGrid({ exercises: updatedExercises });
  };

  const deleteItem = (exerciseId, questionId, itemId) => {
    if (!selectedGrid) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
      const updatedExercises = selectedGrid.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              questions: ex.questions.map(q =>
                q.id === questionId
                  ? { ...q, items: q.items.filter(item => item.id !== itemId) }
                  : q
              )
            }
          : ex
      );
      updateGrid({ exercises: updatedExercises });
    }
  };

  const calculateTotalPoints = (grid) => {
    if (!grid) return 0;
    return grid.exercises.reduce((sum, ex) => {
      if (ex.points === 'auto') {
        return sum + ex.questions.reduce((s, q) => {
          if (q.points === 'auto') {
            return s + q.items.reduce((i, item) => i + item.points, 0);
          }
          return s + (parseFloat(q.points) || 0);
        }, 0);
      }
      return sum + (parseFloat(ex.points) || 0);
    }, 0);
  };

  return (
    <div className="grids-page">
      <div className="page-header">
        <h2>Gestion des Grilles de Correction</h2>
        <p>Créez et modifiez des grilles de correction structurées</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex-between">
          <h3>Grilles disponibles ({grids.length})</h3>
          <button className="button" onClick={createNewGrid}>
            Créer une nouvelle grille
          </button>
        </div>

        {grids.length > 0 && (
          <div className="grids-list">
            {grids.map(grid => (
              <div key={grid.id} className="grid-item">
                <div className="flex-between">
                  <div>
                    <h4>{grid.titre}</h4>
                    <p className="grid-info">
                      Classe: {grid.classe || 'Non spécifiée'} | 
                      Total: {calculateTotalPoints(grid)} points
                    </p>
                  </div>
                  <div>
                    <button
                      className="button"
                      onClick={() => {
                        setSelectedGridId(grid.id);
                        setActiveTab(0);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className="button button-danger"
                      onClick={() => deleteGrid(grid.id)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedGrid && (
        <div className="card">
          <div className="grid-editor">
            <div className="grid-header">
              <div className="form-group">
                <label className="label">Titre du devoir</label>
                <input
                  type="text"
                  className="input"
                  value={selectedGrid.titre}
                  onChange={(e) => updateGrid({ titre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Classe</label>
                <input
                  type="text"
                  className="input"
                  value={selectedGrid.classe}
                  onChange={(e) => updateGrid({ classe: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Total des points</label>
                <input
                  type="text"
                  className="input"
                  value={calculateTotalPoints(selectedGrid)}
                  disabled
                />
              </div>
            </div>

            <div className="exercises-tabs">
              {selectedGrid.exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  className={`tab-button ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  {exercise.nom}
                </button>
              ))}
              <button className="button button-secondary" onClick={addExercise}>
                + Exercice
              </button>
            </div>

            {selectedGrid.exercises[activeTab] && (
              <ExerciseEditor
                exercise={selectedGrid.exercises[activeTab]}
                onUpdate={(updates) => updateExercise(selectedGrid.exercises[activeTab].id, updates)}
                onDelete={() => deleteExercise(selectedGrid.exercises[activeTab].id)}
                onAddQuestion={() => addQuestion(selectedGrid.exercises[activeTab].id)}
                onUpdateQuestion={(questionId, updates) =>
                  updateQuestion(selectedGrid.exercises[activeTab].id, questionId, updates)
                }
                onDeleteQuestion={(questionId) =>
                  deleteQuestion(selectedGrid.exercises[activeTab].id, questionId)
                }
                onAddItem={(questionId) =>
                  addItem(selectedGrid.exercises[activeTab].id, questionId)
                }
                onUpdateItem={(questionId, itemId, updates) =>
                  updateItem(selectedGrid.exercises[activeTab].id, questionId, itemId, updates)
                }
                onDeleteItem={(questionId, itemId) =>
                  deleteItem(selectedGrid.exercises[activeTab].id, questionId, itemId)
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ExerciseEditor = ({
  exercise,
  onUpdate,
  onDelete,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  return (
    <div className="exercise-editor">
      <div className="exercise-header">
        <div className="form-group">
          <label className="label">Nom de l'exercice</label>
          <input
            type="text"
            className="input"
            value={exercise.nom}
            onChange={(e) => onUpdate({ nom: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label">Points</label>
          <input
            type="text"
            className="input"
            value={exercise.points}
            onChange={(e) => onUpdate({ points: e.target.value })}
            placeholder="auto ou nombre"
          />
        </div>
        <button className="button button-danger" onClick={onDelete}>
          Supprimer l'exercice
        </button>
      </div>

      <div className="questions-list">
        {exercise.questions.map((question, qIndex) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <div className="form-group">
                <label className="label">Question {qIndex + 1}</label>
                <input
                  type="text"
                  className="input"
                  value={question.libelle}
                  onChange={(e) => onUpdateQuestion(question.id, { libelle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Points</label>
                <input
                  type="text"
                  className="input"
                  value={question.points}
                  onChange={(e) => onUpdateQuestion(question.id, { points: e.target.value })}
                  placeholder="auto ou nombre"
                />
              </div>
              <button
                className="button button-danger"
                onClick={() => onDeleteQuestion(question.id)}
              >
                Supprimer
              </button>
            </div>

            <div className="items-list">
              <h5>Items</h5>
              {question.items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Intitulé</label>
                      <input
                        type="text"
                        className="input"
                        value={item.intitule}
                        onChange={(e) =>
                          onUpdateItem(question.id, item.id, { intitule: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Points</label>
                      <input
                        type="number"
                        className="input"
                        value={item.points}
                        onChange={(e) =>
                          onUpdateItem(question.id, item.id, {
                            points: parseFloat(e.target.value) || 0
                          })
                        }
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Mode d'évaluation</label>
                      <select
                        className="select"
                        value={item.mode}
                        onChange={(e) =>
                          onUpdateItem(question.id, item.id, { mode: e.target.value })
                        }
                      >
                        <option value="checkbox">Checkbox (tout ou rien)</option>
                        <option value="numeric">Numérique (pas configurable)</option>
                        <option value="half">Numérique (pas 0.5)</option>
                        <option value="scale2">Échelle 0-2</option>
                        <option value="scale4">Échelle 0-4</option>
                        <option value="steps">Échelle personnalisée</option>
                      </select>
                    </div>
                    {item.mode === 'steps' && (
                      <div className="form-group">
                        <label className="label">Nombre de paliers</label>
                        <input
                          type="number"
                          className="input"
                          value={item.steps}
                          onChange={(e) =>
                            onUpdateItem(question.id, item.id, {
                              steps: parseInt(e.target.value) || 4
                            })
                          }
                          min="2"
                        />
                      </div>
                    )}
                    <button
                      className="button button-danger"
                      onClick={() => onDeleteItem(question.id, item.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="button button-secondary"
                onClick={() => onAddItem(question.id)}
              >
                + Ajouter un item
              </button>
            </div>
          </div>
        ))}
        <button className="button button-secondary" onClick={onAddQuestion}>
          + Ajouter une question
        </button>
      </div>
    </div>
  );
};

export default GridsPage;

