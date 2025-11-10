# Guide d'installation - Correcteur de Copies

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (généralement inclus avec Node.js)

## Installation

1. **Installer les dépendances**

```bash
npm install
```

2. **Lancer l'application en mode développement**

```bash
npm start
```

L'application s'ouvrira automatiquement dans votre navigateur à l'adresse `http://localhost:3000`

## Build de production

Pour créer une version de production optimisée :

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `build/`.

## Structure de l'application

```
NoteHub/
├── public/
│   └── index.html          # Page HTML principale
├── src/
│   ├── pages/              # Pages de l'application
│   │   ├── StudentsPage.js      # Gestion des étudiants
│   │   ├── GridsPage.js         # Gestion des grilles
│   │   ├── GradingPage.js       # Notation des copies
│   │   └── DashboardPage.js     # Tableaux de bord
│   ├── utils/              # Utilitaires
│   │   ├── storage.js           # Gestion du localStorage
│   │   ├── calculations.js     # Calculs de scores
│   │   └── csv.js              # Import/Export CSV
│   ├── App.js              # Composant principal avec routing
│   ├── App.css             # Styles principaux
│   ├── index.js            # Point d'entrée
│   └── index.css           # Styles globaux
├── package.json            # Dépendances et scripts
└── README.md              # Documentation principale
```

## Utilisation

### 1. Gestion des étudiants

- Accédez à la page **Étudiants**
- Ajoutez des étudiants avec nom, prénom, classe et présence
- Importez/exportez des listes au format CSV
- Filtrez par classe ou présence

### 2. Création de grilles

- Accédez à la page **Grilles**
- Créez une nouvelle grille avec titre et classe
- Ajoutez des exercices, questions et items
- Configurez les modes d'évaluation pour chaque item
- Les points peuvent être fixes ou calculés automatiquement ("auto")

### 3. Notation

- Accédez à la page **Notation**
- Sélectionnez une grille et un étudiant
- Notez chaque item selon le mode configuré
- Ajoutez des ajustements (bonus/malus) par exercice ou globalement
- Les scores sont calculés automatiquement
- Enregistrez les notes

### 4. Tableaux de bord

- Accédez à la page **Tableaux de bord**
- Sélectionnez une grille
- Consultez les statistiques et le classement
- Ajustez les paramètres de normalisation
- Exportez les résultats en CSV

## Stockage des données

Toutes les données sont stockées localement dans le navigateur (localStorage) :
- Liste des étudiants
- Grilles de correction
- Notes des étudiants

**Important** : Les données sont stockées uniquement dans votre navigateur. Si vous supprimez les données du navigateur, vous perdrez toutes les informations.

## Fonctionnalités

- ✅ Gestion complète des étudiants (CRUD)
- ✅ Import/Export CSV
- ✅ Création de grilles hiérarchiques (Grille → Exercice → Question → Item)
- ✅ Modes d'évaluation multiples (checkbox, numeric, half, scale2, scale4, steps)
- ✅ Calcul automatique des scores à tous les niveaux
- ✅ Ajustements (bonus/malus) par exercice et global
- ✅ Statistiques complètes (moyenne, écart-type, min, max)
- ✅ Normalisation des notes
- ✅ Export CSV des résultats
- ✅ Interface responsive et moderne

## Notes techniques

- L'application utilise React Router pour la navigation
- Les calculs sont effectués en temps réel
- La normalisation des notes utilise la formule z-score
- L'export PDF nécessiterait l'ajout d'une bibliothèque comme jsPDF

