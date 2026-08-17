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

