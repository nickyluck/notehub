import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await authAPI.login(password);
      setMessage({ type: 'success', text: 'Connexion réussie' });
      setTimeout(() => {
        onLogin(data.user);
      }, 500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>NoteHub</h1>
        <p className="login-subtitle">Veuillez entrer le mot de passe pour accéder à l'application</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {message.text && (
            <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

