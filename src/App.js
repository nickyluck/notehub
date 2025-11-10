import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from './utils/api';
import './App.css';
import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import GridsPage from './pages/GridsPage';
import GradingPage from './pages/GradingPage';
import DashboardPage from './pages/DashboardPage';

function Navigation({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    authAPI.logout();
    onLogout();
    navigate('/');
  };
  
  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">NoteHub</h1>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Étudiants
            </Link>
          </li>
          <li>
            <Link to="/grilles" className={location.pathname === '/grilles' ? 'active' : ''}>
              Grilles
            </Link>
          </li>
          <li>
            <Link to="/notation" className={location.pathname === '/notation' ? 'active' : ''}>
              Notation
            </Link>
          </li>
          <li>
            <Link to="/tableaux-de-bord" className={location.pathname === '/tableaux-de-bord' ? 'active' : ''}>
              Tableaux de bord
            </Link>
          </li>
          {user && (
            <li className="user-info">
              <span>{user.name || 'Utilisateur'}</span>
              <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = authAPI.getUser();
      if (authAPI.isAuthenticated() && currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="App">
        <Navigation user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<StudentsPage />} />
            <Route path="/grilles" element={<GridsPage />} />
            <Route path="/notation" element={<GradingPage />} />
            <Route path="/tableaux-de-bord" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

