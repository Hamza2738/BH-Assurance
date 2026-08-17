# 🏢 BH@CONGÉ — Plateforme de Gestion des Congés (BH Assurance)

## 🧩 Fonctionnalités principales

### ✅ Gestion des utilisateurs
- Création des comptes collaborateurs (Employé, Manager, Admin, Super Admin)
- Authentification sécurisée par token JWT
- Envoi automatique des identifiants de connexion par email
- Réinitialisation et changement de mot de passe (lien sécurisé à usage unique)
- Gestion du profil (CRUD) : nom, prénom, CIN, poste, photo, département, grade

### ✅ Gestion des demandes de congé
- Dépôt d'une demande de congé par l'employé (dates, type de congé, motif)
- Calcul automatique du nombre de jours demandés
- Workflow de validation à deux étapes :
  - **Phase 1** : validation par les responsables du département (grade supérieur)
  - **Phase 2** : validation finale par le Super Admin
- Suivi en temps réel du statut de chaque demande (en attente / validée / refusée)
- Notifications en temps réel (Socket.IO) à chaque changement de statut

### ✅ Gestion des soldes de congé
- Suivi du solde de jours disponibles par employé et par type de congé
- Mise à jour automatique du solde après validation d'une demande

### ✅ Traçabilité et historique
- Historique complet et immuable des changements de statut de chaque demande
- Traçabilité des décisions prises par chaque responsable
- Consultation de l'avancement d'une demande, du dépôt jusqu'à la clôture

### ✅ Notifications
- Notifications en temps réel via WebSocket (Socket.IO)
- Salons dédiés par rôle et par département (manager, admin, super admin, employé)
- Types de notifications configurables (création de demande, décision manager, décision finale, information)

### ✅ Administration
- Gestion des départements
- Gestion des grades (hiérarchie / pouvoir de validation)
- Gestion des rôles (super_admin, admin, manager, user)
- Gestion des types de congé

---

## 🏗️ Architecture

Le projet est organisé en deux modules distincts :

```
📦 gestion-conge
┣ 📂 gestion-conge-backend     → API Flask (Python)
┃ ┣ 📂 models          → Entités SQLAlchemy (Utilisateur, Demande, Historique, SoldeConge...)
┃ ┣ 📂 routes           → Endpoints REST (Blueprints Flask)
┃ ┣ 📂 services         → Logique métier (auth, demandes, email, notifications...)
┃ ┣ 📂 config.py        → Configuration (base de données, mail, JWT)
┃ ┗ 📂 socketio_instance → Gestion des événements temps réel
┗ 📂 gestion-conge-frontend    → Application Angular
  ┗ 📂 src/app/application-gestion-conge
    ┣ 📂 auth           → Authentification / connexion
    ┣ 📂 pages           → Écrans métier (demandes, utilisateurs, départements, grades, rôles, types de congé...)
    ┣ 📂 services         → Appels API et gestion d'état
    ┗ 📂 models           → Interfaces TypeScript
```

## ⚙️ Technologies utilisées

**Backend**
- 🐍 Python / Flask
- 🗄️ SQL Server (SQLAlchemy / pyodbc)
- 🔐 JWT (Flask-JWT-Extended)
- 🔌 Flask-SocketIO (notifications temps réel)
- 📧 Flask-Mail (envoi automatique des identifiants et des liens de réinitialisation)

**Frontend**
- 🅰️ Angular 14
- 🎨 SCSS / Bootstrap (template Endless)
- 🔌 Socket.IO Client
- 🗺️ Leaflet / Google Maps (composants cartographiques)

---

## 🧱 Versions des outils utilisés

**Environnement**
| Outil | Version |
|-------|---------|
| Node.js | 18.19.0 |
| npm | 10.2.3 |
| nvm | 1.2.2 |
| Angular CLI (globale, machine) | 19.2.15 ⚠️ |
| Angular CLI (requise par le projet) | 14.0.5 |

> ⚠️ La CLI Angular installée globalement (19.2.15) est bien plus récente que celle attendue par le projet (14.0.5). Utilisez toujours `npm start` ou `npx ng serve` **depuis le dossier du projet** (après `npm install`) afin d'utiliser la CLI locale compatible, plutôt que la commande `ng` globale.

**Backend (Python)**
| Paquet | Version |
|--------|---------|
| Flask | 3.1.1 |
| Flask-SQLAlchemy | 3.1.1 |
| Flask-SocketIO | 5.5.1 |
| Flask-JWT-Extended | 4.7.1 |
| Flask-Mail | 0.10.0 |
| Flask-Session | 0.8.0 |
| Flask-Migrate | 4.1.0 |
| Flask-CORS | 6.0.1 |
| Flask-Login | 0.6.3 |
| SQLAlchemy | 2.0.41 |
| Alembic | 1.16.4 |
| pyodbc | 5.2.0 |
| python-socketio | 5.13.0 |
| python-engineio | 4.12.2 |
| eventlet | 0.40.2 |
| PyJWT | 2.10.1 |
| APScheduler | 3.11.0 |

**Frontend (Angular)**
| Paquet | Version |
|--------|---------|
| Angular Core | 14.0.5 |
| Angular CLI | 14.0.5 |
| TypeScript | 4.7.4 |
| RxJS | 7.5.5 |
| Bootstrap | 5.1.3 |
| Socket.IO Client | 4.8.1 |

---
