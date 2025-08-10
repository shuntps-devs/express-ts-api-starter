# Postman Configuration

Cette configuration Postman complète permet de tester l'ensemble de votre API Express TypeScript.

## Contenu

- `Express-TypeScript-API.postman_collection.json` - Collection complète avec tous les endpoints
- `Development.postman_environment.json` - Variables d'environnement pour le développement local
- `Production.postman_environment.json` - Variables d'environnement pour la production

## Import dans Postman

1. Ouvrez Postman
2. Cliquez sur "Import" en haut à gauche
3. Glissez-déposez les 3 fichiers ou utilisez "Upload Files"
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

## Utilisation

### 1. Workflow d'authentification

1. **Register User** - Créer un nouveau compte utilisateur
2. **Login User** - Se connecter (stocke automatiquement les tokens)
3. **Verify Email** - Vérifier l'email avec le token reçu
4. **Get Current User Profile** - Récupérer le profil utilisateur connecté

### 2. Gestion des utilisateurs

- **Get Current User Profile** - Profil de l'utilisateur connecté
- **Update Current User Profile** - Modifier son profil
- **Get All Users (Admin)** - Liste des utilisateurs (admin seulement)
- **Get User By ID (Admin)** - Détails d'un utilisateur (admin seulement)
- **Update User (Admin)** - Modifier un utilisateur (admin seulement)
- **Delete User (Admin)** - Supprimer un utilisateur (admin seulement)

### 3. Tests automatiques

Chaque requête inclut des tests automatiques qui vérifient :

- Le code de statut HTTP
- La structure de la réponse
- Les données requises
- Le temps de réponse
- La gestion des tokens JWT

### 4. Gestion automatique des tokens

- Les tokens JWT sont automatiquement extraits des cookies après login
- Stockés dans les variables de collection
- Utilisés automatiquement pour les requêtes authentifiées
- Nettoyés lors du logout

## Endpoints disponibles

### Authentication (`/api/auth/`)

- `POST /register` - Inscription d'un nouvel utilisateur
- `POST /login` - Connexion utilisateur
- `POST /refresh` - Renouvellement du token
- `POST /verify-email` - Vérification email
- `POST /resend-verification` - Renvoyer email de vérification
- `POST /logout` - Déconnexion
- `POST /logout-all` - Déconnexion de tous les appareils

### User Management (`/api/users/`)

- `GET /profile` - Profil utilisateur connecté
- `PATCH /profile` - Modifier son profil
- `GET /` - Liste des utilisateurs (admin)
- `GET /:id` - Détails utilisateur (admin)
- `PATCH /:id` - Modifier utilisateur (admin)
- `DELETE /:id` - Supprimer utilisateur (admin)

### Health & Status

- `GET /api/health` - Vérification de santé de l'API
- `GET /api` - Informations sur l'API

### Administration (`/api/admin/`)

- `GET /sessions/active` - Liste des sessions actives
- `GET /sessions/inactive` - Liste des sessions inactives
- `GET /sessions/stats` - Statistiques des sessions
- `DELETE /sessions/inactive` - Nettoyer les sessions inactives
- `DELETE /sessions/:id` - Désactiver une session spécifique
- `POST /cleanup` - Nettoyage complet du système

## Tests recommandés

### Sequence complète

1. **Health Check** - Vérifier que l'API fonctionne
2. **Register User** - Créer un compte de test
3. **Login User** - Se connecter
4. **Get Current User Profile** - Vérifier l'authentification
5. **Update Current User Profile** - Tester la modification de profil
6. **Logout** - Tester la déconnexion

### Tests d'administration

Nécessite un compte admin :

1. **Login** avec des credentials admin
2. **Get All Users** - Liste des utilisateurs
3. **Get User By ID** - Détails d'un utilisateur spécifique
4. **Update User** - Modifier role/statut d'un utilisateur
5. **Delete User** - Supprimer un utilisateur de test

## Personnalisation

### Ajouter de nouveaux endpoints

1. Dupliquez une requête existante
2. Modifiez l'URL, la méthode HTTP et le body
3. Adaptez les tests automatiques selon vos besoins

### Modifier les tests

Les tests sont écrits en JavaScript et utilisent l'API Postman :

```javascript
pm.test('Status code is 200', () => {
  pm.response.to.have.status(200);
});

pm.test('Response has user data', () => {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
});
```

### Variables personnalisées

Ajoutez vos propres variables dans les environnements pour :

- URLs spécifiques
- Données de test
- Configuration personnalisée

## Sécurité

- Les tokens sont marqués comme "secret" en production
- Les mots de passe sont dans les variables d'environnement
- Utilisez des environnements séparés pour dev/staging/prod
- Ne commitez jamais les variables de production avec des vraies credentials

## Troubleshooting

### Erreur 401 (Unauthorized)

1. Vérifiez que vous êtes connecté (Login User)
2. Vérifiez que le token n'est pas expiré (Refresh Token)
3. Pour les endpoints admin, vérifiez le rôle utilisateur

### Erreur de connexion

1. Vérifiez que le serveur fonctionne (`npm run dev`)
2. Vérifiez l'URL de base dans l'environnement
3. Vérifiez les ports et la configuration réseau

### Tests qui échouent

1. Vérifiez que la structure de réponse correspond aux tests
2. Adaptez les tests à votre implémentation
3. Vérifiez les codes de statut attendus
