/**
 * French language translations
 * Contains all text content for the French locale
 * @description Provides structured translations for API responses, errors, validation messages, and system notifications
 */
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
  middleware: {
    requestLoggingConfigured: 'Logging des requêtes configuré',
    securityConfigured: 'Middleware de sécurité configuré',
    rateLimitExceeded:
      'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  auth: {
    invalidToken: "Token d'authentification invalide",
    userNotFound: 'Utilisateur non trouvé',
    refreshTokenRequired: 'Token de rafraîchissement requis',
    invalidRefreshToken: 'Token de rafraîchissement invalide ou expiré',
    authenticationRequired: 'Authentification requise',
    sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
    authenticationError: "Erreur d'authentification",
    accessTokenRequired: "Token d'accès requis",
    invalidOrExpiredToken: 'Token invalide ou expiré',
    insufficientPermissions: 'Permissions insuffisantes',
    credentials: {
      invalid: 'Identifiants invalides',
    },
    email: {
      alreadyExists: 'Cette adresse email existe déjà',
      alreadyVerified: 'Email déjà vérifié',
    },
    username: {
      alreadyExists: "Ce nom d'utilisateur existe déjà",
    },
    account: {
      locked:
        'Compte temporairement verrouillé suite à trop de tentatives de connexion',
      inactive: 'Compte inactif. Impossible de réaliser des opérations email.',
    },
    verification: {
      tokenInvalid: 'Token de vérification email invalide ou expiré',
      required:
        "Vérification email requise. Veuillez vérifier votre email avant d'accéder à cette ressource.",
      requiredWithDays:
        'Vérification email requise. Votre compte est actif depuis {{days}} jours.',
    },
    password: {
      resetSent:
        'Si cet email existe, un lien de réinitialisation a été envoyé',
      resetTokenInvalid: 'Token de réinitialisation invalide ou expiré',
    },
  },
  error: {
    internalServer: "Quelque chose s'est mal passé",
    payloadTooLarge: 'Requête trop volumineuse',
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
  email: {
    verification: {
      subject: 'Vérifiez votre email pour {{appName}}',
      title: 'Vérification Email',
      greeting: 'Bonjour {{username}}',
      intro: 'Merci de vous être inscrit sur <strong>{{appName}}</strong>',
      instruction:
        'Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous',
      button: 'Vérifier mon email',
      expiration: 'Ce lien expire dans {{time}}',
      ignore:
        "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email",
      buttonFallback: 'Si le bouton ne fonctionne pas, copiez ce lien',
      support: "Besoin d'aide ? Contactez-nous",
    },
    welcome: {
      subject: 'Bienvenue sur {{appName}} !',
      title: 'Bienvenue',
      greeting: 'Bienvenue {{username}} !',
      intro:
        'Votre email a été vérifié avec succès. Votre compte est maintenant activé',
      instruction:
        'Vous pouvez maintenant profiter de toutes les fonctionnalités de <strong>{{appName}}</strong>',
      button: 'Se connecter',
      support: "Besoin d'aide ? Notre équipe support est là pour vous",
    },
    passwordReset: {
      subject: 'Réinitialisation de mot de passe - {{appName}}',
      title: 'Réinitialisation mot de passe',
      greeting: 'Bonjour {{username}}',
      intro:
        'Vous avez demandé une réinitialisation de votre mot de passe pour {{appName}}',
      button: 'Réinitialiser le mot de passe',
      expiration: 'Ce lien expire dans {{time}}',
      ignore:
        "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email",
      support: 'Support',
    },
    service: {
      sendSuccess: 'Email envoyé avec succès',
      sendFailure: "Échec de l'envoi de l'email",
      serviceError: 'Erreur du service email',
      sending: "Envoi de l'email",
      sendingFailed: "Échec de l'envoi de l'email",
    },
  },
};
