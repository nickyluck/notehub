# Application Correcteur de Copies

## Vue d'ensemble

L'application **Correcteur de Copies** est une application web développée qui facilite la correction et la notation de devoirs et d'examens pour les enseignants. Elle permet de créer des grilles de correction structurées, de noter les copies des étudiants de manière organisée, et de générer des statistiques et des exports.

L'application permet une gestion complète du processus de notation, de la création des grilles jusqu'à l'export des résultats.

## Fonctionnalités principales

### 1. Gestion des étudiants

La page **Étudiants** permet de gérer la liste des étudiants de la classe.

**Fonctionnalités :**
- **Ajout et modification** : Création et édition de la liste des étudiants via un éditeur de tableau interactif
- **Informations stockées** : Nom, prénom, présence (présent/absent), et classe
- **Import/Export CSV** : Possibilité d'importer une liste d'étudiants depuis un fichier CSV ou d'exporter la liste actuelle
- **Filtrage par classe** : Les étudiants sont organisés par classe
- **Filtrage par présence** : Les étudiants ont un statut présent/absent
- **Réinitialisation** : Option pour réinitialiser complètement la liste des étudiants

### 2. Création et gestion des grilles de correction

La page **Grilles** permet de créer et modifier des grilles de correction structurées de manière hiérarchique.

**Structure hiérarchique :**
- **Grille** : Conteneur principal qui regroupe plusieurs exercices
  - Titre du devoir
  - Classe associée
  - Total des points calculé automatiquement
  
- **Exercice** : Sous-division de la grille
  - Nom de l'exercice
  - Points attribués (fixe ou "auto" calculé à partir des questions)
  
- **Question** : Sous-division d'un exercice
  - Numéro/libellé de la question
  - Points attribués (fixe ou "auto" calculé à partir des items)
  
- **Item** : Critère d'évaluation le plus fin
  - Intitulé de l'item
  - Points attribués
  - Mode d'évaluation (checkbox, numeric, half, scale2, scale4, steps)
  - Paramètre optionnel selon le mode

**Fonctionnalités :**
- **Édition visuelle** : Interface intuitive avec onglets pour chaque exercice
- **Calcul automatique** : Les points peuvent être définis manuellement ou calculés automatiquement ("auto") en sommant les éléments enfants
- **Modes d'évaluation** : Plusieurs modes disponibles pour noter chaque item :
  - `checkbox` : Case à cocher (tout ou rien)
  - `numeric` : Saisie numérique avec pas configurable
  - `half` : Saisie numérique avec pas de 0,5
  - `scale2` : Échelle de 0 à 2
  - `scale4` : Échelle de 0 à 4
  - `steps` : Échelle personnalisée avec nombre de paliers configurable
- **Sauvegarde** : Les grilles sont sauvegardées et peuvent être réutilisées
- **Suppression** : Possibilité de supprimer ou réinitialiser une grille

### 3. Notation des copies

La page **Notation** est le cœur de l'application, permettant de noter les copies des étudiants.

**Processus de notation :**
1. **Sélection** : Choix d'une grille de correction et d'un étudiant
2. **Navigation** : Navigation entre les étudiants avec des boutons précédent/suivant
3. **Saisie des notes** : Pour chaque item, saisie de la note selon le mode d'évaluation configuré
4. **Ajustements** : Possibilité d'ajouter des ajustements (bonus/malus) :
   - Ajustement par exercice
   - Ajustement global pour toute la grille
5. **Calcul automatique** : Les scores sont calculés automatiquement à chaque niveau :
   - Score de l'item → Score de la question → Score de l'exercice → Score total
6. **Affichage en temps réel** : Visualisation immédiate des points obtenus et de la note sur 20
7. **Commentaires** : Zone de texte pour ajouter un commentaire général sur la copie
8. **Sauvegarde** : Enregistrement des notes de l'étudiant

**Fonctionnalités avancées :**
- **Mode personnalisé par étudiant** : Possibilité de changer temporairement le mode d'évaluation d'un item pour un étudiant spécifique
- **Résumé visuel** : Affichage d'un résumé avec le total des points et la note sur 20
- **Détail des exercices** : Tableau récapitulatif montrant les points bruts, ajustements et totaux par exercice

### 4. Tableaux de bord et statistiques

La page **Tableaux de bord** fournit une vue d'ensemble des résultats de notation.

**Informations affichées :**
- **Tableau des notes** : Tableau complet avec :
  - Notes par exercice pour chaque étudiant
  - Total des points obtenus
  - Note calculée (normalisée selon moyenne et écart-type cibles)
  - Rang de classement
  
- **Statistiques** : Tableau récapitulatif avec :
  - Moyenne, écart-type, minimum, maximum pour chaque exercice et le total
  - Points maximums de chaque exercice et du total

**Fonctionnalités :**
- **Paramètres de notation** : Configuration de la moyenne et de l'écart-type cibles pour le calcul de la note normalisée
- **Recalcul** : Bouton pour recalculer toutes les notes
- **Export CSV ou Excel** : Export des données en CSV ou Excel
- **Export PDF** : Export des données en PDF pour chaque élève

## Architecture technique

### Stack technologique

**Frontend :**
- React 18
- React Router pour la navigation
- CSS pour le styling

**Backend :**
- Node.js avec Express
- PostgreSQL pour le stockage des données
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe

### Architecture des données

L'application utilise une architecture client-serveur avec une base de données PostgreSQL :

- **Authentification** : Système de connexion avec mot de passe unique (ADMIN_PASSWORD) et JWT
- **Système mono-utilisateur** : Application dédiée à un seul utilisateur avec authentification par mot de passe unique
- **Stockage durable** : Toutes les données sont persistées dans PostgreSQL

### Structure de stockage

Les données sont stockées dans une base de données PostgreSQL avec les tables suivantes :

- **students** : Liste des étudiants (nom, prénom, présence, classe)
- **grids** : Grilles de correction
- **exercises** : Exercices (liés à une grille)
- **questions** : Questions (liées à un exercice)
- **items** : Items d'évaluation (liés à une question)
- **grades** : Notes des étudiants
- **adjustments** : Ajustements (bonus/malus)
- **comments** : Commentaires sur les copies

### Modèle de données

Les données sont structurées selon une hiérarchie stricte :
- Chaque élément (grille, exercice, question, item) possède un identifiant unique généré par la base de données
- Les points peuvent être définis explicitement ou calculés automatiquement ("auto")
- Les notes des étudiants sont stockées avec une clé composite (grid_id, student_id, item_id)

## Calcul des scores

### Calcul hiérarchique

Le système calcule les scores de manière hiérarchique :

1. **Score d'un item** : Dépend du mode d'évaluation choisi
   - Checkbox : points complets si coché, 0 sinon
   - Numeric/Half : valeur saisie directement
   - Scale2/Scale4/Steps : proportionnelle selon l'échelle

2. **Score d'une question** : Somme des scores des items, mis à l'échelle si les points de la question diffèrent du total des items

3. **Score d'un exercice** : Somme des scores des questions, plus ajustement éventuel, mis à l'échelle si nécessaire

4. **Score total** : Somme des scores des exercices, plus ajustement global éventuel

### Normalisation des notes

Dans les tableaux de bord, les notes sont normalisées selon une moyenne et un écart-type cibles, permettant d'ajuster la distribution des notes tout en conservant l'ordre relatif des étudiants.

## Installation et configuration

### Prérequis

- Node.js (version 14 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm

### Installation

1. **Cloner le projet** (ou télécharger les fichiers)

2. **Configurer la base de données PostgreSQL** :
   ```bash
   createdb correcteur_db
   psql correcteur_db < database/schema.sql
   ```

3. **Configurer le backend** :
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Éditer .env avec vos paramètres de base de données
   ```

4. **Configurer le frontend** :
   ```bash
   # À la racine du projet
   npm install
   # Créer un fichier .env avec :
   # REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Démarrer l'application** :
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm start
   ```

Pour plus de détails, consultez :
- `SETUP_BACKEND.md` - Configuration PostgreSQL local
- `DEPLOY_NEON.md` - Configuration et déploiement avec Neon (cloud)
- `VERCEL_NEON_SETUP.md` - Si vous avez créé Neon depuis Vercel
- `SETUP_DATABASE.md` - Script automatique pour créer les tables (recommandé)

### Authentification

L'application nécessite une inscription/connexion :
- Créez un compte lors du premier lancement
- Connectez-vous avec vos identifiants
- Vos données sont isolées et privées

## Gestion des erreurs

L'application intègre un système de gestion d'erreurs robuste :

- **Messages conviviaux** : Les erreurs techniques sont converties en messages compréhensibles pour l'utilisateur
- **Gestion API** : Gestion automatique des erreurs réseau et de connexion
- **Récupération gracieuse** : L'application tente de récupérer des erreurs sans interrompre le flux de travail
- **Validation des données** : Validation automatique côté client et serveur

## Cas d'usage typique

1. **Préparation** :
   - Créer la liste des étudiants dans la page Étudiants
   - Créer une grille de correction dans la page Grilles avec la structure des exercices, questions et items

2. **Notation** :
   - Aller dans la page Notation
   - Sélectionner la grille et un étudiant
   - Noter chaque item en naviguant entre les exercices
   - Ajouter des ajustements si nécessaire
   - Enregistrer les notes de l'étudiant
   - Passer à l'étudiant suivant

3. **Analyse** :
   - Consulter la page Tableaux de bord
   - Ajuster les paramètres de notation si nécessaire
   - Exporter les résultats en CSV ou Excel
   - Exporter les résultats en PDF (une page par élève)

## Points forts

- **Flexibilité** : Structure hiérarchique adaptable à différents types d'évaluations
- **Automatisation** : Calculs automatiques à tous les niveaux
- **Organisation** : Gestion claire des étudiants, grilles et notes
- **Traçabilité** : Toutes les données sont sauvegardées et peuvent être exportées
- **Sécurité** : Authentification JWT et isolation des données par utilisateur
- **Stockage durable** : Base de données PostgreSQL pour une persistance fiable
- **Multi-utilisateurs** : Chaque enseignant a son propre espace de travail
- **Robustesse** : Gestion d'erreurs et validation des données côté client et serveur

