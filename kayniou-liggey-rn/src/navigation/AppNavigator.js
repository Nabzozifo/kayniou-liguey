import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants';
import api from '../services/api';

// Import des écrans
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileTypeSelectionScreen from '../screens/auth/ProfileTypeSelectionScreen';

// Écrans Client
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import WorkerDetailsScreen from '../screens/client/WorkerDetailsScreen';
import CreateRequestScreen from '../screens/client/CreateRequestScreen';
import MyRequestsScreen from '../screens/client/MyRequestsScreen';
import SelectWorkersScreen from '../screens/client/SelectWorkersScreen';
import SmartSearchScreen from '../screens/client/SmartSearchScreen';

// Écrans Worker
import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import AvailableRequestsScreen from '../screens/worker/AvailableRequestsScreen';
import WorkerProfileSetupScreen from '../screens/worker/WorkerProfileSetupScreen';
import CompleteProfileScreen from '../screens/worker/CompleteProfileScreen';
import CreateQuoteScreen from '../screens/worker/CreateQuoteScreen';
import MyQuotesScreen from '../screens/worker/MyQuotesScreen';
import EditWorkerProfileScreen from '../screens/worker/EditWorkerProfileScreen';
import CategorySelectionScreen from '../screens/worker/CategorySelectionScreen';

// Écrans communs
import ChatScreen from '../screens/chat/ChatScreen';
import ConversationsListScreen from '../screens/chat/ConversationsListScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import RequestDetailsScreen from '../screens/common/RequestDetailsScreen';
import WorksitesListScreen from '../screens/common/WorksitesListScreen';
import WorksiteDetailsScreen from '../screens/common/WorksiteDetailsScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import RatingScreen from '../screens/common/RatingScreen';
import ChatbotScreen from '../screens/common/ChatbotScreen';
import PrivacyScreen from '../screens/common/PrivacyScreen';
import NotificationsSettingsScreen from '../screens/common/NotificationsSettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Composant pour le bouton de notification avec badge
const NotificationButton = () => {
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);

    // Écouter les changements de navigation pour rafraîchir le badge
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUnreadCount();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchUnreadCount, navigation]);

  return (
    <TouchableOpacity
      style={styles.notificationButton}
      onPress={() => navigation.navigate('Notifications')}
    >
      <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Navigation pour les utilisateurs non authentifiés
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ProfileTypeSelection"
        component={ProfileTypeSelectionScreen}
      />
      <Stack.Screen
        name="CategorySelection"
        component={CategorySelectionScreen}
        options={{ headerShown: true, title: 'Sélectionnez vos catégories' }}
      />
    </Stack.Navigator>
  );
};

// Tabs pour les clients
const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        headerRight: () => <NotificationButton />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyRequests') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Worksites') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ClientHomeScreen}
        options={{ title: 'Accueil', tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{ title: 'Mes demandes', tabBarLabel: 'Demandes' }}
      />
      <Tab.Screen
        name="Worksites"
        component={WorksitesListScreen}
        options={{ title: 'Chantiers', tabBarLabel: 'Chantiers' }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsListScreen}
        options={{ title: 'Messages', tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// Tabs pour les travailleurs
const WorkerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        headerRight: () => <NotificationButton />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AvailableRequests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MyQuotes') {
            iconName = focused ? 'document-attach' : 'document-attach-outline';
          } else if (route.name === 'Worksites') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={WorkerHomeScreen}
        options={{ title: 'Carte des Jobs', tabBarLabel: 'Carte' }}
      />
      <Tab.Screen
        name="AvailableRequests"
        component={AvailableRequestsScreen}
        options={{ title: 'Demandes disponibles', tabBarLabel: 'Demandes' }}
      />
      <Tab.Screen
        name="MyQuotes"
        component={MyQuotesScreen}
        options={{ title: 'Mes devis', tabBarLabel: 'Devis' }}
      />
      <Tab.Screen
        name="Worksites"
        component={WorksitesListScreen}
        options={{ title: 'Chantiers', tabBarLabel: 'Chantiers' }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsListScreen}
        options={{ title: 'Messages', tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// Navigation principale
const MainNavigator = () => {
  const { isAuthenticated, isClient, isWorker } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : isClient ? (
        <>
          <Stack.Screen name="ClientMain" component={ClientTabNavigator} />
          <Stack.Screen
            name="WorkerDetails"
            component={WorkerDetailsScreen}
            options={{ headerShown: true, title: 'Détails du travailleur' }}
          />
          <Stack.Screen
            name="CreateRequest"
            component={CreateRequestScreen}
            options={{ headerShown: true, title: 'Créer une demande' }}
          />
          <Stack.Screen
            name="SelectWorkers"
            component={SelectWorkersScreen}
            options={{ headerShown: true, title: 'Sélectionner des workers' }}
          />
          <Stack.Screen
            name="RequestDetails"
            component={RequestDetailsScreen}
            options={{ headerShown: true, title: 'Détails de la demande' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WorksiteDetails"
            component={WorksiteDetailsScreen}
            options={{ headerShown: true, title: 'Détails du chantier' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, title: 'Notifications' }}
          />
          <Stack.Screen
            name="Rating"
            component={RatingScreen}
            options={{ headerShown: true, title: 'Évaluer' }}
          />
          <Stack.Screen
            name="SmartSearch"
            component={SmartSearchScreen}
            options={{ headerShown: true, title: 'Recherche Intelligente' }}
          />
          <Stack.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: true, title: 'Confidentialité' }}
          />
          <Stack.Screen
            name="NotificationsSettings"
            component={NotificationsSettingsScreen}
            options={{ headerShown: true, title: 'Notifications' }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ headerShown: true, title: 'Aide & Support' }}
          />
        </>
      ) : isWorker ? (
        <>
          <Stack.Screen name="WorkerMain" component={WorkerTabNavigator} />
          <Stack.Screen
            name="WorkerProfileSetup"
            component={WorkerProfileSetupScreen}
            options={{ headerShown: true, title: 'Compléter votre profil' }}
          />
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
            options={{ headerShown: true, title: 'Compléter votre profil' }}
          />
          <Stack.Screen
            name="CreateQuote"
            component={CreateQuoteScreen}
            options={{ headerShown: true, title: 'Créer un devis' }}
          />
          <Stack.Screen
            name="RequestDetails"
            component={RequestDetailsScreen}
            options={{ headerShown: true, title: 'Détails de la demande' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WorksiteDetails"
            component={WorksiteDetailsScreen}
            options={{ headerShown: true, title: 'Détails du chantier' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, title: 'Notifications' }}
          />
          <Stack.Screen
            name="WorkerDashboard"
            component={WorkerDashboardScreen}
            options={{ headerShown: true, title: 'Tableau de Bord' }}
          />
          <Stack.Screen
            name="EditWorkerProfile"
            component={EditWorkerProfileScreen}
            options={{ headerShown: true, title: 'Modifier le Profil' }}
          />
          <Stack.Screen
            name="Rating"
            component={RatingScreen}
            options={{ headerShown: true, title: 'Évaluer' }}
          />
          <Stack.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: true, title: 'Confidentialité' }}
          />
          <Stack.Screen
            name="NotificationsSettings"
            component={NotificationsSettingsScreen}
            options={{ headerShown: true, title: 'Notifications' }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ headerShown: true, title: 'Aide & Support' }}
          />
        </>
      ) : null}
    </Stack.Navigator>
  );
};

// Conteneur de navigation
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: COLORS.error || COLORS.danger || '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AppNavigator;
