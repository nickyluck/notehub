-- Table des étudiants
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    classe VARCHAR(100),
    presence VARCHAR(20) DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des grilles
CREATE TABLE IF NOT EXISTS grids (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    classe VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des exercices
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES grids(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    points VARCHAR(50) DEFAULT 'auto',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    libelle TEXT NOT NULL,
    points VARCHAR(50) DEFAULT 'auto',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des items
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    intitule TEXT NOT NULL,
    points DECIMAL(10,2) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    steps INTEGER,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notes (grades)
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES grids(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    value TEXT,
    custom_mode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grid_id, student_id, item_id)
);

-- Table des ajustements
CREATE TABLE IF NOT EXISTS adjustments (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES grids(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    exercise_id INTEGER,
    adjustment_type VARCHAR(20) NOT NULL, -- 'exercise' ou 'global'
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    grid_id INTEGER REFERENCES grids(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grid_id, student_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_grades_composite ON grades(grid_id, student_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_composite ON adjustments(grid_id, student_id);

