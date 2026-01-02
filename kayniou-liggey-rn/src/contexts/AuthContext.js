import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import notificationService from '../services/notificationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'utilisateur depuis le stockage au démarrage
  useEffect(() => {
    loadUser();
  }, []);

  // Initialiser les notifications push lorsque l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      initializePushNotifications();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        setUser(JSON.parse(userStr));
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

      // Initialiser le service de notification
      const pushToken = await notificationService.initialize();

      if (pushToken) {
        // Enregistrer le token sur le serveur
        await notificationService.registerPushToken(user.id);
        console.log('✅ Notifications push activées');
      } else {
        console.log('⚠️ Impossible d\'obtenir le token push');
      }

      // Écouter les notifications reçues
      notificationService.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification reçue:', notification);
      });

      // Écouter les interactions avec les notifications
      notificationService.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification cliquée:', response);
        // Naviguer vers l'écran approprié selon le type de notification
        // TODO: Implémenter la navigation
      });
    } catch (error) {
      console.error('❌ Erreur initialisation push notifications:', error);
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
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
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

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updateFCMToken,
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
