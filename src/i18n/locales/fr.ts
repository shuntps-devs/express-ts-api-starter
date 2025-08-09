export const fr = {
  api: {
    service: {
      name: 'API Express TypeScript',
    },
    welcome: {
      message: "Bienvenue sur l'API Express TypeScript",
    },
  },
  server: {
    startup: {
      success: 'Serveur démarré en mode {{env}} sur http://localhost:{{port}}',
      failure: 'Échec du démarrage du serveur',
    },
    shutdown: {
      start: "Signal {{signal}} reçu. Démarrage de l'arrêt gracieux...",
      timeout: "Délai d'arrêt du serveur atteint",
      connections: 'Connexions actives avant arrêt : {{count}}',
      waiting: 'Attente de la fermeture des connexions actives...',
      success: 'Serveur fermé avec succès',
      completed: 'Arrêt gracieux terminé',
      error: "Erreur lors de l'arrêt gracieux",
    },
  },
  database: {
    connected: 'MongoDB Connecté : {{host}}',
    error: 'Erreur de connexion à MongoDB',
    disconnected: 'MongoDB déconnecté',
    connectionFailed: 'Échec de connexion à MongoDB',
    continuingWithoutDb: 'Continuation sans base de données',
  },
  auth: {
    invalidToken: "Token d'authentification invalide",
    userNotFound: 'Utilisateur non trouvé',
    refreshTokenRequired: 'Token de rafraîchissement requis',
    invalidRefreshToken: 'Token de rafraîchissement invalide ou expiré',
    credentials: {
      invalid: 'Identifiants invalides',
    },
    email: {
      alreadyExists: 'Cette adresse email existe déjà',
    },
    username: {
      alreadyExists: "Ce nom d'utilisateur existe déjà",
    },
    account: {
      locked:
        'Compte temporairement verrouillé suite à trop de tentatives de connexion',
    },
  },
  error: {
    internalServer: "Quelque chose s'est mal passé",
    validation: {
      invalidInput: "Données d'entrée invalides",
    },
  },
  env: {
    validationError: "Échec de validation de l'environnement",
  },
  success: {
    userCreated:
      'Utilisateur créé avec succès. Veuillez vérifier votre email pour activer votre compte.',
    loginSuccessful: 'Connexion réussie',
    logoutSuccessful: 'Déconnexion réussie',
    logoutAllSuccessful: 'Déconnexion de tous les appareils réussie',
    tokenRefreshed: 'Token rafraîchi avec succès',
    sessionsRetrieved: 'Sessions récupérées avec succès',
    profileRetrieved: 'Profil récupéré avec succès',
    resourceCreated: 'Ressource créée avec succès',
    resourceUpdated: 'Ressource mise à jour avec succès',
    resourceDeleted: 'Ressource supprimée avec succès',
  },
  errors: {
    badRequest: 'Requête incorrecte',
    unauthorized: 'Non autorisé',
    forbidden: 'Interdit',
    resourceNotFound: 'Ressource non trouvée',
    conflict: 'Conflit',
    validationFailed: 'Échec de validation',
    tooManyRequests: 'Trop de requêtes',
    internalServerError: 'Erreur interne du serveur',
  },
  validation: {
    email: {
      invalid: "Format d'email invalide",
      required: "L'email est requis",
    },
    password: {
      minLength: 'Le mot de passe doit contenir au moins {{min}} caractères',
      complexity:
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      required: 'Le mot de passe est requis',
      current: 'Le mot de passe actuel est requis',
    },
    username: {
      minLength:
        "Le nom d'utilisateur doit contenir au moins {{min}} caractères",
      maxLength:
        "Le nom d'utilisateur doit contenir au plus {{max}} caractères",
      required: "Le nom d'utilisateur est requis",
    },
    token: {
      required: 'Le token est requis',
      resetRequired: 'Le token de réinitialisation est requis',
      verificationRequired: 'Le token de vérification est requis',
    },
    identifier: {
      required: "L'email ou le nom d'utilisateur est requis",
    },
  },
};
