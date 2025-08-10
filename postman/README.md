# Postman Configuration - MISE À JOUR v1.1.0

Cette configuration Postman mise à jour permet de tester l'ensemble de votre API Express TypeScript avec le nouveau ProfileController.

## ✅ Dernières modifications (v1.1.0)

- **🔄 Architecture mise à jour** : Séparation des endpoints profil et utilisateurs
- **📝 Nouveaux endpoints Profile** : `/api/profile/*` pour la gestion de profil utilisateur
- **👑 Endpoints Admin** : `/api/users/*` réservés à la gestion administrative
- **📷 Gestion Avatar** : Upload/suppression/configuration d'avatars
- **🧪 Tests améliorés** : Validation complète des réponses et performance

## Contenu

- `Express-TypeScript-API.postman_collection.json` - Collection mise à jour avec ProfileController
- `Development.postman_environment.json` - Variables d'environnement pour le développement local
- `Production.postman_environment.json` - Variables d'environnement pour la production
- `Express-TypeScript-API.postman_collection.backup.json` - Sauvegarde de l'ancienne version

## Import dans Postman

1. Ouvrez Postman
2. Cliquez sur "Import" en haut à gauche
3. Glissez-déposez les 3 fichiers principaux ou utilisez "Upload Files"
4. La collection et les environnements seront importés automatiquement

## Configuration

### Variables d'environnement Development

- `baseUrl`: http://localhost:3000 (modifiez si votre serveur utilise un autre port)
- `testEmail`: test@example.com
- `testPassword`: SecurePassword123!
- `adminEmail`: admin@example.com
- `adminPassword`: AdminPassword123!

### Variables d'environnement Production

- `baseUrl`: https://your-api-domain.com (remplacez par votre domaine)
- Mêmes variables que Development avec des valeurs de production

## 🆕 Nouvelle Architecture des Endpoints

### 👤 Profile Management (`/api/profile/`)

**Endpoints utilisateurs authentifiés pour la gestion de leur propre profil :**

- `GET /api/profile` - Récupérer son profil utilisateur
- `PATCH /api/profile` - Modifier son profil
- `POST /api/profile/avatar` - Upload d'avatar (multipart/form-data)
- `DELETE /api/profile/avatar` - Supprimer son avatar
- `GET /api/profile/avatar/config` - Configuration upload d'avatar (public)

### 👑 User Management Admin (`/api/users/`)

**Endpoints administrateurs pour la gestion des utilisateurs :**

- `GET /api/users` - Liste paginée des utilisateurs (admin seulement)
- `GET /api/users/:id` - Détails utilisateur par ID (admin seulement)
- `PATCH /api/users/:id` - Modifier utilisateur par ID (admin seulement)
- `DELETE /api/users/:id` - Supprimer utilisateur par ID (admin seulement)

## Utilisation

### 1. Workflow d'authentification

1. **Register User** - Créer un nouveau compte utilisateur
2. **Login User** - Se connecter (stocke automatiquement les tokens)
3. **Refresh Token** - Renouveler les tokens automatiquement

### 2. Gestion de profil utilisateur (Nouveau ✨)

1. **Get User Profile** - Récupérer son profil complet
2. **Update Profile** - Modifier firstName, lastName, bio, location, etc.
3. **Upload Avatar** - Upload d'image (JPG, PNG, WEBP - max 5MB)
4. **Remove Avatar** - Supprimer son avatar
5. **Get Avatar Config** - Voir les limites et formats supportés

### 3. Administration des utilisateurs

**Réservé aux admins** :

- **Get All Users** - Liste paginée avec filtres
- **Get User By ID** - Profil détaillé d'un utilisateur
- **Update User By ID** - Modifier role, statut, etc.
- **Delete User By ID** - Suppression d'utilisateur

### 4. Tests automatiques améliorés

Chaque requête inclut des tests automatiques qui vérifient :

- ✅ Code de statut HTTP correct
- ✅ Structure de réponse complète
- ✅ Données profil requises
- ✅ Temps de réponse < seuils définis
- ✅ Gestion automatique des tokens JWT
- ✅ Validation des données d'avatar

## 📋 Endpoints disponibles

### Authentication (`/api/auth/`)

- `POST /register` - Inscription avec profil initial
- `POST /login` - Connexion avec tokens automatiques
- `POST /refresh` - Renouvellement automatique des tokens
- `POST /logout` - Déconnexion avec nettoyage des cookies

### Profile Management (`/api/profile/`) ✨ NOUVEAU

- `GET /` - Mon profil utilisateur complet
- `PATCH /` - Modifier mon profil (firstName, lastName, bio, location, socialLinks, etc.)
- `POST /avatar` - Upload d'avatar avec validation (multipart/form-data)
- `DELETE /avatar` - Supprimer mon avatar et fichiers
- `GET /avatar/config` - Configuration d'upload (formats, taille max, etc.)

### User Management Admin (`/api/users/`)

- `GET /` - Liste paginée des utilisateurs (admin)
- `GET /:id` - Utilisateur par ID (admin)
- `PATCH /:id` - Modifier utilisateur (admin)
- `DELETE /:id` - Supprimer utilisateur (admin)

### Health & Status

- `GET /api/health` - Vérification de santé avec uptime
- `GET /api` - Informations API et endpoints disponibles

## 🧪 Workflow de Tests Recommandés

### Sequence complète utilisateur

1. **Health Check** - Vérifier que l'API fonctionne
2. **Register User** - Créer un compte avec profil initial
3. **Login User** - Se connecter (tokens automatiques)
4. **Get User Profile** - Vérifier profil et authentification
5. **Update Profile** - Modifier informations personnelles
6. **Get Avatar Config** - Voir les contraintes d'upload
7. **Upload Avatar** - Téléverser une image de profil
8. **Get User Profile** - Vérifier avatar dans le profil
9. **Remove Avatar** - Supprimer l'avatar
10. **Logout** - Se déconnecter proprement

### Tests d'administration

**Nécessite un compte admin** :

1. **Login** avec credentials admin
2. **Get All Users** - Liste avec pagination
3. **Get User by ID** - Profil détaillé d'un utilisateur
4. **Update User by ID** - Changer role/statut
5. **Delete User by ID** - Supprimer utilisateur de test

## 🔧 Nouveautés techniques

### Variables automatiques

- `userId` - ID utilisateur extrait automatiquement au login
- `accessToken` - Token JWT automatiquement géré
- `refreshToken` - Token de renouvellement automatique

### Tests de performance

- Profile endpoints : < 1000ms
- Update operations : < 2000ms
- Avatar upload : < 5000ms
- Admin operations : < 1500ms

### Validation robuste

```javascript
// Exemple de test automatique pour profile
pm.test('Response has profile data', () => {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData.data).to.have.property('profile');
  pm.expect(jsonData.data.profile).to.have.property('userId');
  pm.expect(jsonData.data.profile).to.have.property('firstName');
});
```

## 🛡️ Sécurité et Bonnes Pratiques

- **Tokens automatiques** : Gestion JWT transparente avec cookies HTTP-only
- **Rôles utilisateur** : Séparation claire endpoints utilisateur/admin
- **Upload sécurisé** : Validation format/taille pour avatars
- **Variables sensibles** : Marquées comme secrets en production
- **Environnements isolés** : Dev/staging/prod séparés

## 🔄 Migration depuis l'ancienne version

### Endpoints modifiés

| Ancien endpoint                | Nouveau endpoint                 | Notes                       |
| ------------------------------ | -------------------------------- | --------------------------- |
| `GET /api/users/profile`       | `GET /api/profile`               | Profil utilisateur connecté |
| `PATCH /api/users/profile`     | `PATCH /api/profile`             | Modification profil         |
| `POST /api/users/avatar`       | `POST /api/profile/avatar`       | Upload avatar               |
| `DELETE /api/users/avatar`     | `DELETE /api/profile/avatar`     | Suppression avatar          |
| `GET /api/users/avatar/config` | `GET /api/profile/avatar/config` | Config upload               |

### Changements de structure

- **Profil utilisateur** : Maintenant dans `/api/profile`
- **Gestion admin** : Maintenant dans `/api/users` (admin seulement)
- **Tests améliorés** : Validation plus stricte des réponses
- **Performance** : Seuils de temps de réponse définis

## Troubleshooting

### Erreur 404 sur anciens endpoints

➡️ **Solution** : Utilisez les nouveaux endpoints `/api/profile/*`

### Erreur 403 sur endpoints admin

➡️ **Solution** : Vérifiez que l'utilisateur a le rôle ADMIN

### Upload avatar échoue

➡️ **Solution** : Vérifiez format (JPG/PNG/WEBP) et taille (< 5MB)

### Tests automatiques échouent

➡️ **Solution** : Importez la nouvelle collection v1.1.0
