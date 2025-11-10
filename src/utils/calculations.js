// Utilitaires pour les calculs de scores

export const calculateItemScore = (item, value, customMode = null) => {
  const mode = customMode || item.mode;
  const maxPoints = item.points;

  if (value === null || value === undefined) return 0;

  switch (mode) {
    case 'checkbox':
      return value ? maxPoints : 0;
    
    case 'numeric':
    case 'half':
      return Math.min(Math.max(0, parseFloat(value) || 0), maxPoints);
    
    case 'scale2':
      return (value / 2) * maxPoints;
    
    case 'scale4':
      return (value / 4) * maxPoints;
    
    case 'steps':
      const steps = item.steps || 4;
      return (value / steps) * maxPoints;
    
    default:
      return 0;
  }
};

export const calculateQuestionScore = (question, items, itemScores) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.points, 0);
  const itemsScore = items.reduce((sum, item) => sum + (itemScores[item.id] || 0), 0);
  
  if (question.points === 'auto') {
    return itemsScore;
  }
  
  const questionPoints = parseFloat(question.points) || 0;
  if (itemsTotal === 0) return 0;
  
  // Mise à l'échelle si nécessaire
  return (itemsScore / itemsTotal) * questionPoints;
};

export const calculateExerciseScore = (exercise, questions, questionScores, adjustment = 0) => {
  const questionsTotal = questions.reduce((sum, q) => {
    const points = q.points === 'auto' 
      ? q.items.reduce((s, item) => s + item.points, 0)
      : parseFloat(q.points) || 0;
    return sum + points;
  }, 0);
  
  const questionsScore = questions.reduce((sum, q) => sum + (questionScores[q.id] || 0), 0);
  
  if (exercise.points === 'auto') {
    return Math.max(0, questionsScore + adjustment);
  }
  
  const exercisePoints = parseFloat(exercise.points) || 0;
  if (questionsTotal === 0) return Math.max(0, adjustment);
  
  // Mise à l'échelle si nécessaire
  const scaledScore = (questionsScore / questionsTotal) * exercisePoints;
  return Math.max(0, scaledScore + adjustment);
};

export const calculateTotalScore = (grid, exerciseScores, globalAdjustment = 0) => {
  const exercisesTotal = grid.exercises.reduce((sum, ex) => {
    const points = ex.points === 'auto'
      ? ex.questions.reduce((s, q) => {
          const qPoints = q.points === 'auto'
            ? q.items.reduce((i, item) => i + item.points, 0)
            : parseFloat(q.points) || 0;
          return s + qPoints;
        }, 0)
      : parseFloat(ex.points) || 0;
    return sum + points;
  }, 0);
  
  const exercisesScore = grid.exercises.reduce((sum, ex) => sum + (exerciseScores[ex.id] || 0), 0);
  
  return Math.max(0, exercisesScore + globalAdjustment);
};

export const normalizeGrade = (score, maxScore, targetMean = 10, targetStdDev = 3) => {
  if (maxScore === 0) return 0;
  
  // Calcul de la note sur 20 basée sur le score
  const rawGrade = (score / maxScore) * 20;
  
  // Pour la normalisation, on aurait besoin de toutes les notes
  // Ici, on retourne simplement la note sur 20
  return Math.max(0, Math.min(20, rawGrade));
};

export const calculateStatistics = (grades) => {
  if (grades.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0
    };
  }

  const mean = grades.reduce((sum, g) => sum + g, 0) / grades.length;
  const variance = grades.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / grades.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...grades);
  const max = Math.max(...grades);

  return { mean, stdDev, min, max };
};

