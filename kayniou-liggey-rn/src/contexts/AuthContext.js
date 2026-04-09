import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import notificationService from '../services/notificationService';
import * as PushNotifications from '../services/pushNotificationService';
import locationService from '../services/locationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'utilisateur depuis le stockage au démarrage
  useEffect(() => {
    loadUser();
  }, []);

  // Initialiser les notifications push et le service de localisation lorsque l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      initializePushNotifications();
      initializeLocationService();
    } else {
      // Cleanup when user logs out
      locationService.cleanup();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        // Set cached user immediately so the app loads fast
        setUser(JSON.parse(userStr));
        // Then silently refresh from server to get up-to-date subscription/isVerified
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            await AsyncStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (_) {
          // Network offline — cached data is fine
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialiser les notifications push
  const initializePushNotifications = async () => {
    try {
      // Vérifier que l'utilisateur existe avant d'initialiser
      if (!user || !user.id) {
        console.log('⚠️ Utilisateur non connecté, notifications push non initialisées');
        return;
      }

      console.log('🔔 Initialisation des notifications push...');

      // Enregistrer pour les notifications Expo Push
      const pushToken = await PushNotifications.registerForPushNotificationsAsync(user.id);

      if (pushToken) {
        console.log('✅ Notifications push Expo activées:', pushToken);
      } else {
        console.log('⚠️ Impossible d\'obtenir le token push Expo');
      }

      // Initialiser l'ancien service de notification (in-app)
      try {
        const oldPushToken = await notificationService.initialize();
        if (oldPushToken) {
          await notificationService.registerPushToken(user.id);
        }
      } catch (err) {
        console.log('⚠️ Service notif in-app non disponible:', err.message);
      }

      // Configurer les listeners de notifications
      const subscriptions = PushNotifications.setupNotificationListeners(
        (notification) => {
          console.log('📩 Notification reçue:', notification);
          const type = notification.request.content.data?.type;
          if (type === 'premium_approved' || type === 'verification_approved' || type === 'verification_rejected') {
            refreshUser();
          }
          notificationService.fetchUnreadCount?.();
        },
        (data) => {
          console.log('👆 Notification tapée:', data);
          if (data?.type === 'premium_approved' || data?.type === 'verification_approved' || data?.type === 'verification_rejected') {
            refreshUser();
          }
        }
      );

      // Cleanup au unmount
      return () => {
        PushNotifications.cleanupNotificationListeners(subscriptions);
      };
    } catch (error) {
      console.error('❌ Erreur initialisation push notifications:', error);
    }
  };

  // Initialiser le service de localisation
  const initializeLocationService = () => {
    try {
      if (!user || !user.id || !user.userType) {
        console.log('⚠️ Utilisateur non connecté, service de localisation non initialisé');
        return;
      }

      console.log('📍 Initialisation du service de localisation...');
      locationService.initialize(user.id, user.userType);
    } catch (error) {
      console.error('❌ Erreur initialisation service de localisation:', error);
    }
  };

  // Inscription
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      setUser(response.user);

      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      setUser(response.user);

      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Erreur lors de la connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      // Cleanup location service before logout
      locationService.cleanup();
    } catch (err) {
      console.error('Erreur cleanup location:', err);
    }

    try {
      await authService.logout();
    } catch (err) {
      console.error('Erreur authService.logout:', err);
    }

    // Toujours mettre user à null pour revenir à l'écran d'accueil
    setUser(null);
  };

  // Mettre à jour le profil utilisateur
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile(profileData);
      setUser(response.user);

      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le token FCM
  const updateFCMToken = async (fcmToken) => {
    try {
      await authService.updateFCMToken(fcmToken);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du token FCM:', err);
    }
  };

  // Mettre à jour l'utilisateur manuellement (ex: après abonnement)
  const updateUser = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Erreur mise à jour user local:', err);
    }
  };

  // Rafraîchir l'utilisateur depuis le serveur (ex: après approbation premium/vérification)
  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.error('Erreur refresh user:', err);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updateFCMToken,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    isClient: user?.userType === 'client',
    isWorker: user?.userType === 'worker',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
