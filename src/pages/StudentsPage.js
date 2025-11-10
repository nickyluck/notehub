import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../utils/api';
import { exportToCSV, importFromCSV } from '../utils/csv';
import './StudentsPage.css';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', classe: '', presence: 'present' });
  const [filterClass, setFilterClass] = useState('');
  const [filterPresence, setFilterPresence] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsAPI.getAll();
      setStudents(data);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors du chargement: ${error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.classe.trim()) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await studentsAPI.update(editingId, formData);
        setMessage({ type: 'success', text: 'Étudiant modifié avec succès' });
      } else {
        await studentsAPI.create(formData);
        setMessage({ type: 'success', text: 'Étudiant ajouté avec succès' });
      }
      await loadStudents();
      setFormData({ nom: '', prenom: '', classe: '', presence: 'present' });
      setEditingId(null);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      nom: student.nom,
      prenom: student.prenom,
      classe: student.classe,
      presence: student.presence
    });
    setEditingId(student.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      try {
        setLoading(true);
        await studentsAPI.delete(id);
        setMessage({ type: 'success', text: 'Étudiant supprimé avec succès' });
        await loadStudents();
      } catch (error) {
        setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les étudiants ?')) {
      try {
        setLoading(true);
        const deletePromises = students.map(s => studentsAPI.delete(s.id));
        await Promise.all(deletePromises);
        setMessage({ type: 'success', text: 'Liste réinitialisée' });
        await loadStudents();
      } catch (error) {
        setMessage({ type: 'error', text: `Erreur: ${error.message}` });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleExport = () => {
    const data = students.map(s => ({
      Nom: s.nom,
      Prénom: s.prenom,
      Classe: s.classe,
      Présence: s.presence === 'present' ? 'Présent' : 'Absent'
    }));
    exportToCSV(data, 'etudiants.csv');
    setMessage({ type: 'success', text: 'Export réussi' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await importFromCSV(file);
      const imported = data.map(row => ({
        nom: row.Nom || row.nom || '',
        prenom: row.Prénom || row.prenom || '',
        classe: row.Classe || row.classe || '',
        presence: (row.Présence || row.presence || 'present').toLowerCase().includes('absent') ? 'absent' : 'present'
      })).filter(s => s.nom && s.prenom && s.classe);

      if (imported.length > 0) {
        const createPromises = imported.map(student => studentsAPI.create(student));
        await Promise.all(createPromises);
        setMessage({ type: 'success', text: `${imported.length} étudiant(s) importé(s) avec succès` });
        await loadStudents();
      } else {
        setMessage({ type: 'error', text: 'Aucun étudiant valide trouvé dans le fichier' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de l'import: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }

    e.target.value = '';
  };

  const classes = [...new Set(students.map(s => s.classe))].sort();
  const filteredStudents = students.filter(s => {
    const matchClass = !filterClass || s.classe === filterClass;
    const matchPresence = filterPresence === 'all' || s.presence === filterPresence;
    return matchClass && matchPresence;
  });

  return (
    <div className="students-page">
      <div className="page-header">
        <h2>Gestion des Étudiants</h2>
        <p>Créez et gérez la liste des étudiants de votre classe</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h3>{editingId ? 'Modifier un étudiant' : 'Ajouter un étudiant'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Nom *</label>
              <input
                type="text"
                className="input"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Prénom *</label>
              <input
                type="text"
                className="input"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Classe *</label>
              <input
                type="text"
                className="input"
                value={formData.classe}
                onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Présence</label>
              <select
                className="select"
                value={formData.presence}
                onChange={(e) => setFormData({ ...formData, presence: e.target.value })}
              >
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="button">
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            {editingId && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ nom: '', prenom: '', classe: '', presence: 'present' });
                }}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h3>Liste des Étudiants ({filteredStudents.length})</h3>
          <div className="flex gap-1">
            <button className="button button-success" onClick={handleExport}>
              Exporter CSV
            </button>
            <label className="button button-secondary">
              Importer CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button className="button button-danger" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="filters">
          <div className="form-group">
            <label className="label">Filtrer par classe</label>
            <select
              className="select"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Filtrer par présence</label>
            <select
              className="select"
              value={filterPresence}
              onChange={(e) => setFilterPresence(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="no-data">Chargement...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="no-data">Aucun étudiant trouvé</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Classe</th>
                <th>Présence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.nom}</td>
                  <td>{student.prenom}</td>
                  <td>{student.classe}</td>
                  <td>
                    <span className={`badge badge-${student.presence === 'present' ? 'success' : 'danger'}`}>
                      {student.presence === 'present' ? 'Présent' : 'Absent'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button button-secondary"
                      onClick={() => handleEdit(student)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Modifier
                    </button>
                    <button
                      className="button button-danger"
                      onClick={() => handleDelete(student.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;

