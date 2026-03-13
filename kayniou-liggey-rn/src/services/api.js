import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API - ngrok pour tester avec Expo Go
// const API_URL = 'https://pamela-unrestful-thermodynamically.ngrok-free.dev/api';
const API_URL = 'http://16.171.129.93:5000/api';
// Créer une instance Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/update-profile', profileData);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  updateFCMToken: async (fcmToken) => {
    const response = await api.put('/auth/fcm-token', { fcmToken });
    return response.data;
  },

  verifyPhone: async (firebaseToken) => {
    const response = await api.post('/auth/verify-phone', { firebaseToken });
    return response.data;
  },
};

// Services d'abonnement
export const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  subscribe: async (planId) => {
    const response = await api.post('/subscription/subscribe', { planId });
    return response.data;
  },

  cancel: async () => {
    const response = await api.post('/subscription/cancel');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },
};

// Services de profil client
export const clientProfileService = {
  getProfile: async (userId) => {
    const response = await api.get(`/client-profile/${userId}`);
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/client-profile/${userId}`, profileData);
    return response.data;
  },
};

// Services de profil travailleur
export const workerProfileService = {
  getProfile: async (userId) => {
    const response = await api.get(`/worker-profile/${userId}`);
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/worker-profile/${userId}`, profileData);
    return response.data;
  },

  updateAvailability: async (userId, isAvailable) => {
    const response = await api.put(`/worker-profile/${userId}/availability`, {
      isAvailable,
    });
    return response.data;
  },

  updateLocation: async (userId, location) => {
    const response = await api.put(`/worker-profile/${userId}/location`, location);
    return response.data;
  },

  searchWorkers: async (filters) => {
    const response = await api.post('/worker-profile/search', filters);
    return response.data;
  },

  getNearbyWorkers: async (latitude, longitude, radius = 10) => {
    const response = await api.get('/worker-profile/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },
};

// Services de demande de service
export const serviceRequestService = {
  create: async (requestData) => {
    const response = await api.post('/service-request', requestData);
    return response.data;
  },

  getById: async (requestId) => {
    const response = await api.get(`/service-request/${requestId}`);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/service-request/my-requests');
    return response.data;
  },

  getAvailableRequests: async () => {
    const response = await api.get('/service-request/available');
    return response.data;
  },

  updateStatus: async (requestId, status) => {
    const response = await api.put(`/service-request/${requestId}/status`, {
      status,
    });
    return response.data;
  },

  update: async (requestId, requestData) => {
    const response = await api.put(`/service-requests/${requestId}`, requestData);
    return response.data;
  },

  delete: async (requestId) => {
    const response = await api.delete(`/service-requests/${requestId}`);
    return response.data;
  },

  cancel: async (requestId) => {
    const response = await api.put(`/service-request/${requestId}/cancel`);
    return response.data;
  },
};

// Services de devis
export const quoteService = {
  create: async (quoteData) => {
    const response = await api.post('/quote', quoteData);
    return response.data;
  },

  getByRequestId: async (requestId) => {
    const response = await api.get(`/quote/request/${requestId}`);
    return response.data;
  },

  accept: async (quoteId) => {
    const response = await api.put(`/quote/${quoteId}/accept`);
    return response.data;
  },

  reject: async (quoteId) => {
    const response = await api.put(`/quote/${quoteId}/reject`);
    return response.data;
  },
};

// Services de chat
export const chatService = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (messageData) => {
    const response = await api.post('/chat/message', messageData);
    return response.data;
  },

  markAsRead: async (conversationId) => {
    const response = await api.put(`/chat/${conversationId}/read`);
    return response.data;
  },
};

// Services d'avis
export const reviewService = {
  create: async (reviewData) => {
    const response = await api.post('/review', reviewData);
    return response.data;
  },

  getByWorkerId: async (workerId) => {
    const response = await api.get(`/review/worker/${workerId}`);
    return response.data;
  },

  respond: async (reviewId, responseText) => {
    const response = await api.put(`/review/${reviewId}/respond`, {
      workerResponse: responseText,
    });
    return response.data;
  },
};

// Services de chantiers
export const worksiteService = {
  getWorksites: async (params) => {
    const response = await api.get('/worksites', { params });
    return response.data;
  },

  getWorksite: async (worksiteId) => {
    const response = await api.get(`/worksites/${worksiteId}`);
    return response.data;
  },

  getActivity: async (worksiteId) => {
    const response = await api.get(`/worksites/${worksiteId}/activity`);
    return response.data;
  },

  startWork: async (worksiteId) => {
    const response = await api.put(`/worksites/${worksiteId}/start`);
    return response.data;
  },

  finishWork: async (worksiteId) => {
    const response = await api.put(`/worksites/${worksiteId}/finish`);
    return response.data;
  },

  validateWork: async (worksiteId) => {
    const response = await api.put(`/worksites/${worksiteId}/validate`);
    return response.data;
  },

  cancelWorksite: async (worksiteId, reason) => {
    const response = await api.put(`/worksites/${worksiteId}/cancel`, { reason });
    return response.data;
  },

  updateWorkerStatus: async (worksiteId, statusData) => {
    const response = await api.put(`/worksites/${worksiteId}/worker-status`, statusData);
    return response.data;
  },

  updateWorkerLocation: async (worksiteId, location) => {
    const response = await api.put(`/worksites/${worksiteId}/worker-location`, location);
    return response.data;
  },
};

export default api;
