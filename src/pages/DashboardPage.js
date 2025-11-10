import React, { useState, useEffect } from 'react';
import { gridsAPI, studentsAPI, gradesAPI } from '../utils/api';
import { exportToCSV } from '../utils/csv';
import { calculateStatistics, normalizeGrade } from '../utils/calculations';
import './DashboardPage.css';

const DashboardPage = () => {
  const [grids, setGrids] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGridId, setSelectedGridId] = useState('');
  const [targetMean, setTargetMean] = useState(10);
  const [targetStdDev, setTargetStdDev] = useState(3);
  const [gradesData, setGradesData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGridId) {
      calculateGrades();
    }
  }, [selectedGridId, targetMean, targetStdDev]);

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

  const calculateGrades = async () => {
    if (!selectedGridId) return;

    const grid = grids.find(g => g.id === selectedGridId);
    if (!grid) return;

    const filteredStudents = students.filter(s =>
      !grid.classe || s.classe === grid.classe
    );

    setLoading(true);
    try {
      // Charger les notes pour tous les étudiants
      const allGradesData = await Promise.all(
        filteredStudents.map(async (student) => {
          try {
            const data = await gradesAPI.get(selectedGridId, student.id);
            return { studentId: student.id, ...data };
          } catch (error) {
            // Si aucune note n'existe, retourner des valeurs vides
            return { studentId: student.id, grades: {}, adjustments: {}, comment: '' };
          }
        })
      );

      // Créer un map pour accéder rapidement aux données
      const gradesMap = {};
      allGradesData.forEach(data => {
        gradesMap[data.studentId] = data;
      });

      const results = filteredStudents.map(student => {
        const studentData = gradesMap[student.id] || { grades: {}, adjustments: {}, comment: '' };

      // Calculer les scores pour chaque exercice
      const exerciseScores = {};
      let totalScore = 0;
      let totalMax = 0;

      grid.exercises.forEach(exercise => {
        let exerciseScore = 0;
        let exerciseMax = 0;

        exercise.questions.forEach(question => {
          let questionScore = 0;
          let questionMax = 0;

          question.items.forEach(item => {
            const itemKey = `${exercise.id}_${question.id}_${item.id}`;
            const itemGrade = studentData.grades?.[itemKey];
            
            if (itemGrade) {
              const value = itemGrade.value;
              const customMode = itemGrade.customMode;
              const mode = customMode || item.mode;
              let itemScore = 0;

              switch (mode) {
                case 'checkbox':
                  itemScore = value ? item.points : 0;
                  break;
                case 'numeric':
                case 'half':
                  itemScore = Math.min(Math.max(0, parseFloat(value) || 0), item.points);
                  break;
                case 'scale2':
                  itemScore = (value / 2) * item.points;
                  break;
                case 'scale4':
                  itemScore = (value / 4) * item.points;
                  break;
                case 'steps':
                  const steps = item.steps || 4;
                  itemScore = (value / steps) * item.points;
                  break;
              }

              questionScore += itemScore;
            }

            questionMax += item.points;
          });

          // Mise à l'échelle si nécessaire
          if (question.points !== 'auto') {
            const questionPoints = parseFloat(question.points) || 0;
            if (questionMax > 0) {
              questionScore = (questionScore / questionMax) * questionPoints;
            }
            questionMax = questionPoints;
          }

          exerciseScore += questionScore;
          exerciseMax += questionMax;
        });

        // Ajustement exercice
        const adjustment = studentData.adjustments?.[exercise.id] || 0;
        exerciseScore += adjustment;

        // Mise à l'échelle si nécessaire
        if (exercise.points !== 'auto') {
          const exercisePoints = parseFloat(exercise.points) || 0;
          if (exerciseMax > 0) {
            exerciseScore = (exerciseScore / exerciseMax) * exercisePoints;
          }
          exerciseMax = exercisePoints;
        }

        exerciseScores[exercise.id] = exerciseScore;
        totalScore += exerciseScore;
        totalMax += exerciseMax;
      });

      // Ajustement global
      const globalAdjustment = studentData.adjustments?.global || 0;
      totalScore += globalAdjustment;

      // Calcul de la note sur 20
      const gradeOn20 = totalMax > 0 ? (totalScore / totalMax) * 20 : 0;

      return {
        student,
        exerciseScores,
        totalScore,
        totalMax,
        gradeOn20,
        normalizedGrade: gradeOn20 // Pour l'instant, on utilise la note directe
      };
    });

    // Calcul des statistiques
    const exerciseStats = {};
    grid.exercises.forEach(exercise => {
      const scores = results.map(r => r.exerciseScores[exercise.id] || 0);
      exerciseStats[exercise.id] = calculateStatistics(scores);
    });

    const totalScores = results.map(r => r.totalScore);
    const totalStats = calculateStatistics(totalScores);

    const gradesOn20 = results.map(r => r.gradeOn20);
    const gradeStats = calculateStatistics(gradesOn20);

    // Normalisation des notes
    if (gradesOn20.length > 1) {
      const currentMean = gradeStats.mean;
      const currentStdDev = gradeStats.stdDev;

      if (currentStdDev > 0) {
        results.forEach(result => {
          const z = (result.gradeOn20 - currentMean) / currentStdDev;
          result.normalizedGrade = Math.max(0, Math.min(20, targetMean + z * targetStdDev));
        });
      }
    }

    // Tri par note normalisée décroissante
    results.sort((a, b) => b.normalizedGrade - a.normalizedGrade);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

      setGradesData({
        results,
        exerciseStats,
        totalStats,
        gradeStats,
        grid
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors du calcul: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!gradesData) {
      setMessage({ type: 'error', text: 'Aucune donnée à exporter' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const data = gradesData.results.map(result => {
      const row = {
        Rang: result.rank,
        Nom: result.student.nom,
        Prénom: result.student.prenom,
        Classe: result.student.classe
      };

      gradesData.grid.exercises.forEach(exercise => {
        row[exercise.nom] = (result.exerciseScores[exercise.id] || 0).toFixed(2);
      });

      row['Total Points'] = result.totalScore.toFixed(2);
      row['Note sur 20'] = result.gradeOn20.toFixed(2);
      row['Note Normalisée'] = result.normalizedGrade.toFixed(2);

      return row;
    });

    exportToCSV(data, `tableau_notes_${gradesData.grid.titre.replace(/\s+/g, '_')}.csv`);
    setMessage({ type: 'success', text: 'Export CSV réussi' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleExportPDF = () => {
    // Pour l'export PDF, on utiliserait une bibliothèque comme jsPDF
    // Pour l'instant, on affiche un message
    setMessage({ type: 'error', text: "L'export PDF nécessite une bibliothèque supplémentaire (jsPDF)" });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRecalculate = () => {
    calculateGrades();
    setMessage({ type: 'success', text: 'Notes recalculées' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (!selectedGridId) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h2>Tableaux de Bord</h2>
          <p>Sélectionnez une grille pour afficher les statistiques</p>
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
        </div>
      </div>
    );
  }

  if (!gradesData) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h2>Tableaux de Bord</h2>
        </div>
        <div className="card">
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h2>Tableaux de Bord</h2>
        <p>{gradesData.grid.titre}</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex-between mb-2">
          <h3>Paramètres de notation</h3>
          <div className="flex gap-1">
            <button className="button" onClick={handleRecalculate}>
              Recalculer
            </button>
            <button className="button button-success" onClick={handleExportCSV}>
              Exporter CSV
            </button>
            <button className="button button-success" onClick={handleExportPDF}>
              Exporter PDF
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Moyenne cible</label>
            <input
              type="number"
              className="input"
              value={targetMean}
              onChange={(e) => setTargetMean(parseFloat(e.target.value) || 10)}
              step="0.1"
              min="0"
              max="20"
            />
          </div>
          <div className="form-group">
            <label className="label">Écart-type cible</label>
            <input
              type="number"
              className="input"
              value={targetStdDev}
              onChange={(e) => setTargetStdDev(parseFloat(e.target.value) || 3)}
              step="0.1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="label">Grille</label>
            <select
              className="select"
              value={selectedGridId}
              onChange={(e) => setSelectedGridId(e.target.value)}
            >
              {grids.map(grid => (
                <option key={grid.id} value={grid.id}>
                  {grid.titre} {grid.classe ? `(${grid.classe})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Tableau des notes</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Classe</th>
                {gradesData.grid.exercises.map(exercise => (
                  <th key={exercise.id}>{exercise.nom}</th>
                ))}
                <th>Total Points</th>
                <th>Note /20</th>
                <th>Note Normalisée</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.results.map(result => (
                <tr key={result.student.id}>
                  <td>{result.rank}</td>
                  <td>{result.student.nom}</td>
                  <td>{result.student.prenom}</td>
                  <td>{result.student.classe}</td>
                  {gradesData.grid.exercises.map(exercise => (
                    <td key={exercise.id}>
                      {(result.exerciseScores[exercise.id] || 0).toFixed(2)}
                    </td>
                  ))}
                  <td><strong>{result.totalScore.toFixed(2)}</strong></td>
                  <td><strong>{result.gradeOn20.toFixed(2)}</strong></td>
                  <td><strong className="normalized-grade">
                    {result.normalizedGrade.toFixed(2)}
                  </strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Statistiques</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Exercice</th>
                <th>Points Max</th>
                <th>Moyenne</th>
                <th>Écart-type</th>
                <th>Minimum</th>
                <th>Maximum</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.grid.exercises.map(exercise => {
                const stats = gradesData.exerciseStats[exercise.id];
                const maxPoints = exercise.points === 'auto'
                  ? exercise.questions.reduce((sum, q) => {
                      const qPoints = q.points === 'auto'
                        ? q.items.reduce((i, item) => i + item.points, 0)
                        : parseFloat(q.points) || 0;
                      return sum + qPoints;
                    }, 0)
                  : parseFloat(exercise.points) || 0;

                return (
                  <tr key={exercise.id}>
                    <td><strong>{exercise.nom}</strong></td>
                    <td>{maxPoints.toFixed(2)}</td>
                    <td>{stats.mean.toFixed(2)}</td>
                    <td>{stats.stdDev.toFixed(2)}</td>
                    <td>{stats.min.toFixed(2)}</td>
                    <td>{stats.max.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td>{gradesData.results[0]?.totalMax.toFixed(2) || '0.00'}</td>
                <td>{gradesData.totalStats.mean.toFixed(2)}</td>
                <td>{gradesData.totalStats.stdDev.toFixed(2)}</td>
                <td>{gradesData.totalStats.min.toFixed(2)}</td>
                <td>{gradesData.totalStats.max.toFixed(2)}</td>
              </tr>
              <tr className="grade-row">
                <td><strong>Note sur 20</strong></td>
                <td>20.00</td>
                <td>{gradesData.gradeStats.mean.toFixed(2)}</td>
                <td>{gradesData.gradeStats.stdDev.toFixed(2)}</td>
                <td>{gradesData.gradeStats.min.toFixed(2)}</td>
                <td>{gradesData.gradeStats.max.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

