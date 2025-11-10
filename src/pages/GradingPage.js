import React, { useState, useEffect } from 'react';
import { gridsAPI, studentsAPI, gradesAPI } from '../utils/api';
import {
  calculateItemScore,
  calculateQuestionScore,
  calculateExerciseScore,
  calculateTotalScore
} from '../utils/calculations';
import './GradingPage.css';

const GradingPage = () => {
  const [grids, setGrids] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGridId, setSelectedGridId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [grades, setGrades] = useState({});
  const [adjustments, setAdjustments] = useState({});
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGridId && selectedStudentId) {
      loadStudentGrades();
    }
  }, [selectedGridId, selectedStudentId]);

  const loadData = async () => {
    try {
      const [gridsData, studentsData] = await Promise.all([
        gridsAPI.getAll(),
        studentsAPI.getAll()
      ]);
      setGrids(gridsData);
      setStudents(studentsData);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors du chargement: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const loadStudentGrades = async () => {
    if (!selectedGridId || !selectedStudentId) return;
    try {
      const data = await gradesAPI.get(selectedGridId, selectedStudentId);
      setGrades(data.grades || {});
      setAdjustments(data.adjustments || {});
      setComment(data.comment || '');
    } catch (error) {
      // Si aucune note n'existe encore, initialiser avec des valeurs vides
      if (error.message.includes('404') || error.message.includes('non trouvé')) {
        setGrades({});
        setAdjustments({});
        setComment('');
      } else {
        setMessage({ type: 'error', text: `Erreur: ${error.message}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const saveStudentGrades = async () => {
    if (!selectedGridId || !selectedStudentId) return;
    try {
      await gradesAPI.save(selectedGridId, selectedStudentId, {
        grades,
        adjustments,
        comment
      });
      setMessage({ type: 'success', text: 'Notes enregistrées avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const selectedGrid = grids.find(g => String(g.id) === String(selectedGridId));
  const selectedStudent = students.find(s => String(s.id) === String(selectedStudentId));

  const handleItemChange = (exerciseId, questionId, itemId, value, customMode = null) => {
    const newGrades = { ...grades };
    const key = `${exerciseId}_${questionId}_${itemId}`;
    newGrades[key] = { value, customMode };
    setGrades(newGrades);
  };

  const handleAdjustmentChange = (exerciseId, value) => {
    const newAdjustments = { ...adjustments };
    if (value === 0 || value === '') {
      delete newAdjustments[exerciseId];
    } else {
      newAdjustments[exerciseId] = parseFloat(value) || 0;
    }
    setAdjustments(newAdjustments);
  };

  const handleGlobalAdjustmentChange = (value) => {
    const newAdjustments = { ...adjustments };
    if (value === 0 || value === '') {
      delete newAdjustments.global;
    } else {
      newAdjustments.global = parseFloat(value) || 0;
    }
    setAdjustments(newAdjustments);
  };

  const calculateScores = () => {
    if (!selectedGrid) return {};

    const scores = {
      items: {},
      questions: {},
      exercises: {},
      total: 0
    };

    selectedGrid.exercises.forEach(exercise => {
      exercise.questions.forEach(question => {
        question.items.forEach(item => {
          const key = `${exercise.id}_${question.id}_${item.id}`;
          const gradeData = grades[key] || {};
          const itemScore = calculateItemScore(item, gradeData.value, gradeData.customMode);
          scores.items[key] = itemScore;
        });

        const questionItems = question.items;
        const itemScores = questionItems.reduce((acc, item) => {
          const key = `${exercise.id}_${question.id}_${item.id}`;
          acc[item.id] = scores.items[key] || 0;
          return acc;
        }, {});

        const questionScore = calculateQuestionScore(question, questionItems, itemScores);
        scores.questions[question.id] = questionScore;
      });

      const exerciseQuestions = exercise.questions;
      const questionScores = exerciseQuestions.reduce((acc, q) => {
        acc[q.id] = scores.questions[q.id] || 0;
        return acc;
      }, {});

      const exerciseAdjustment = adjustments[exercise.id] || 0;
      const exerciseScore = calculateExerciseScore(
        exercise,
        exerciseQuestions,
        questionScores,
        exerciseAdjustment
      );
      scores.exercises[exercise.id] = exerciseScore;
    });

    const exerciseScores = selectedGrid.exercises.reduce((acc, ex) => {
      acc[ex.id] = scores.exercises[ex.id] || 0;
      return acc;
    }, {});

    const globalAdjustment = adjustments.global || 0;
    scores.total = calculateTotalScore(selectedGrid, exerciseScores, globalAdjustment);

    return scores;
  };

  const scores = calculateScores();

  const getTotalPoints = () => {
    if (!selectedGrid) return 0;
    return selectedGrid.exercises.reduce((sum, ex) => {
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

  const getGradeOn20 = () => {
    const totalPoints = getTotalPoints();
    if (totalPoints === 0) return 0;
    return (scores.total / totalPoints) * 20;
  };

  const navigateStudent = (direction) => {
    const currentIndex = students.findIndex(s => String(s.id) === String(selectedStudentId));
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % students.length
      : (currentIndex - 1 + students.length) % students.length;

    setSelectedStudentId(students[newIndex].id);
  };

  const filteredStudents = students.filter(s => 
    !selectedGrid || !selectedGrid.classe || s.classe === selectedGrid.classe
  );

  if (!selectedGrid || !selectedStudent) {
    return (
      <div className="grading-page">
        <div className="page-header">
          <h2>Notation des Copies</h2>
          <p>Sélectionnez une grille et un étudiant pour commencer la notation</p>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="label">Sélectionner une grille</label>
            <select
              className="select"
              value={selectedGridId}
              onChange={(e) => setSelectedGridId(e.target.value)}
            >
              <option value="">-- Choisir une grille --</option>
              {grids.map(grid => (
                <option key={grid.id} value={grid.id}>
                  {grid.titre} {grid.classe ? `(${grid.classe})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedGridId && (
            <div className="form-group">
              <label className="label">Sélectionner un étudiant</label>
              <select
                className="select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- Choisir un étudiant --</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.nom} {student.prenom} {student.classe ? `(${student.classe})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grading-page">
      <div className="page-header">
        <h2>Notation des Copies</h2>
        <p>Noter la copie de {selectedStudent?.prenom} {selectedStudent?.nom}</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="grading-header">
          <div>
            <h3>{selectedGrid.titre}</h3>
            <p>Étudiant: {selectedStudent.prenom} {selectedStudent.nom}</p>
          </div>
          <div className="navigation-buttons">
            <button
              className="button button-secondary"
              onClick={() => navigateStudent('prev')}
            >
              ← Précédent
            </button>
            <button
              className="button button-secondary"
              onClick={() => navigateStudent('next')}
            >
              Suivant →
            </button>
            <button className="button" onClick={saveStudentGrades}>
              Enregistrer
            </button>
          </div>
        </div>

        <div className="summary-box">
          <div className="summary-item">
            <span className="summary-label">Points obtenus:</span>
            <span className="summary-value">{scores.total.toFixed(2)} / {getTotalPoints()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Note sur 20:</span>
            <span className="summary-value">{getGradeOn20().toFixed(2)} / 20</span>
          </div>
        </div>

        <div className="exercises-tabs">
          {selectedGrid.exercises.map((exercise, index) => (
            <button
              key={exercise.id}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {exercise.nom} ({scores.exercises[exercise.id]?.toFixed(2) || '0.00'})
            </button>
          ))}
        </div>

        {selectedGrid.exercises[activeTab] && (
          <ExerciseGrading
            exercise={selectedGrid.exercises[activeTab]}
            grades={grades}
            scores={scores}
            adjustments={adjustments}
            onItemChange={handleItemChange}
            onAdjustmentChange={handleAdjustmentChange}
          />
        )}

        <div className="card mt-2">
          <h4>Ajustement global</h4>
          <div className="form-group">
            <input
              type="number"
              className="input"
              value={adjustments.global || ''}
              onChange={(e) => handleGlobalAdjustmentChange(e.target.value)}
              placeholder="Bonus/Malus global"
              step="0.5"
            />
          </div>
        </div>

        <div className="card mt-2">
          <h4>Commentaire général</h4>
          <textarea
            className="textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire sur la copie..."
            rows="4"
          />
        </div>
      </div>
    </div>
  );
};

const ExerciseGrading = ({
  exercise,
  grades,
  scores,
  adjustments,
  onItemChange,
  onAdjustmentChange
}) => {
  return (
    <div className="exercise-grading">
      <div className="exercise-header-grading">
        <h4>{exercise.nom}</h4>
        <div className="form-group">
          <label className="label">Ajustement exercice</label>
          <input
            type="number"
            className="input"
            value={adjustments[exercise.id] || ''}
            onChange={(e) => onAdjustmentChange(exercise.id, e.target.value)}
            placeholder="Bonus/Malus"
            step="0.5"
          />
        </div>
      </div>

      {exercise.questions.map((question, qIndex) => (
        <div key={question.id} className="question-grading">
          <h5>Question {qIndex + 1}: {question.libelle}</h5>
          <p className="question-score">
            Score: {scores.questions[question.id]?.toFixed(2) || '0.00'} / {
              question.points === 'auto'
                ? question.items.reduce((sum, item) => sum + item.points, 0)
                : question.points
            }
          </p>

          <div className="items-grading">
            {question.items.map((item) => {
              const key = `${exercise.id}_${question.id}_${item.id}`;
              const gradeData = grades[key] || {};
              const itemScore = scores.items[key] || 0;

              return (
                <ItemGrading
                  key={item.id}
                  item={item}
                  value={gradeData.value}
                  customMode={gradeData.customMode}
                  score={itemScore}
                  onChange={(value, customMode) =>
                    onItemChange(exercise.id, question.id, item.id, value, customMode)
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const ItemGrading = ({ item, value, customMode, score, onChange }) => {
  const mode = customMode || item.mode;
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue, customMode);
  };

  const renderInput = () => {
    switch (mode) {
      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localValue === true}
              onChange={(e) => handleChange(e.target.checked)}
            />
            <span>Coché = {item.points} points</span>
          </label>
        );

      case 'numeric':
        return (
          <input
            type="number"
            className="input"
            value={localValue || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            min="0"
            max={item.points}
            step="0.1"
            placeholder={`0 - ${item.points}`}
          />
        );

      case 'half':
        return (
          <input
            type="number"
            className="input"
            value={localValue || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            min="0"
            max={item.points}
            step="0.5"
            placeholder={`0 - ${item.points}`}
          />
        );

      case 'scale2':
        return (
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0"
              max="2"
              step="1"
              value={localValue !== null && localValue !== undefined ? localValue : 0}
              onChange={(e) => handleChange(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>0</span>
              <span className="slider-value">{localValue !== null && localValue !== undefined ? localValue : 0}</span>
              <span>2</span>
            </div>
          </div>
        );

      case 'scale4':
        return (
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0"
              max="4"
              step="1"
              value={localValue !== null && localValue !== undefined ? localValue : 0}
              onChange={(e) => handleChange(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>0</span>
              <span className="slider-value">{localValue !== null && localValue !== undefined ? localValue : 0}</span>
              <span>4</span>
            </div>
          </div>
        );

      case 'steps':
        const steps = item.steps || 4;
        return (
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="0"
              max={steps}
              step="1"
              value={localValue !== null && localValue !== undefined ? localValue : 0}
              onChange={(e) => handleChange(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>0</span>
              <span className="slider-value">{localValue !== null && localValue !== undefined ? localValue : 0}</span>
              <span>{steps}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="item-grading">
      <div className="item-header">
        <div>
          <strong>{item.intitule}</strong>
          <span className="item-info">
            ({item.points} points - {mode})
          </span>
        </div>
        <div className="item-score">Score: {score.toFixed(2)}</div>
      </div>
      <div className="item-input">
        {renderInput()}
        {!customMode && (
          <select
            className="select"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onChange(localValue, e.target.value);
              }
            }}
            style={{ marginTop: '0.5rem' }}
          >
            <option value="">Mode par défaut</option>
            <option value="checkbox">Forcer: Checkbox</option>
            <option value="numeric">Forcer: Numérique</option>
            <option value="half">Forcer: Demi-points</option>
            <option value="scale2">Forcer: Échelle 0-2</option>
            <option value="scale4">Forcer: Échelle 0-4</option>
            <option value="steps">Forcer: Échelle personnalisée</option>
          </select>
        )}
        {customMode && (
          <button
            className="button button-secondary"
            onClick={() => onChange(localValue, null)}
            style={{ marginTop: '0.5rem' }}
          >
            Réinitialiser au mode par défaut
          </button>
        )}
      </div>
    </div>
  );
};

export default GradingPage;

