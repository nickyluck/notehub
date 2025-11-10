const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Récupérer le token depuis localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Fonction générique pour les requêtes API
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur API' }));
      throw new Error(error.error || 'Erreur API');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// API Auth
export const authAPI = {
  login: async (password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erreur lors de la lecture de l\'utilisateur:', error);
      // Nettoyer le localStorage en cas d'erreur
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      return null;
    }
  }
};

// API Students
export const studentsAPI = {
  getAll: () => apiRequest('/students'),
  create: (student) => apiRequest('/students', {
    method: 'POST',
    body: JSON.stringify(student)
  }),
  update: (id, student) => apiRequest(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(student)
  }),
  delete: (id) => apiRequest(`/students/${id}`, {
    method: 'DELETE'
  })
};

// API Grids
export const gridsAPI = {
  getAll: () => apiRequest('/grids'),
  get: (id) => apiRequest(`/grids/${id}`),
  create: (grid) => apiRequest('/grids', {
    method: 'POST',
    body: JSON.stringify(grid)
  }),
  update: (id, grid) => apiRequest(`/grids/${id}`, {
    method: 'PUT',
    body: JSON.stringify(grid)
  }),
  delete: (id) => apiRequest(`/grids/${id}`, {
    method: 'DELETE'
  })
};

// API Grades
export const gradesAPI = {
  get: (gridId, studentId) => 
    apiRequest(`/grades/${gridId}/${studentId}`),
  save: (gridId, studentId, data) =>
    apiRequest(`/grades/${gridId}/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

