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
import WorkerDetailsScreen from '../screens/auth/WorkerDetailsScreen'; // NOTE: This was also imported in Client screens, but here we use it for Auth flow too, ideally we should check if it's the same or different. 
// Wait, line 19 imports WorkerDetailsScreen from '../screens/client/WorkerDetailsScreen'.
// I created it in '../screens/auth/WorkerDetailsScreen'.
// I should use a different name or fix imports.
import AuthWorkerDetailsScreen from '../screens/auth/WorkerDetailsScreen';
import OTPScreen from '../screens/auth/OTPScreen';

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
import PricingScreen from '../screens/worker/PricingScreen';

// Écrans communs
import ChatScreen from '../screens/chat/ChatScreen';
import ConversationsListScreen from '../screens/chat/ConversationsListScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import RequestDetailsScreen from '../screens/common/RequestDetailsScreen';
import WorksitesListScreen from '../screens/common/WorksitesListScreen';
import WorksiteDetailsScreen from '../screens/common/WorksiteDetailsScreen';
import RatingScreen from '../screens/common/RatingScreen';
import ChatbotScreen from '../screens/common/ChatbotScreen';
import PrivacyScreen from '../screens/common/PrivacyScreen';
import NotificationsSettingsScreen from '../screens/common/NotificationsSettingsScreen';
import SupportScreen from '../screens/common/SupportScreen';
import NotificationTestScreen from '../screens/common/NotificationTestScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Composant pour icône avec badge (simple dot rouge)
const TabIconWithBadge = ({ iconName, color, size, showBadge }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={iconName} size={size} color={color} />
      {showBadge && <View style={styles.tabBadgeDot} />}
    </View>
  );
};

// Hook pour récupérer les badges (simple true/false)
const useBadgeCounts = () => {
  const [badges, setBadges] = useState({
    messages: false,
    quotes: false,
    worksites: false,
  });

  const fetchBadges = useCallback(async () => {
    try {
      // Messages non lus - vérifier s'il y a vraiment des messages non lus
      let hasUnreadMessages = false;
      try {
        const messagesResponse = await api.get('/chat/conversations');
        hasUnreadMessages = messagesResponse.data.conversations?.some(
          conv => conv.unreadCount && conv.unreadCount > 0
        ) || false;
      } catch (err) {
        console.log('Erreur messages:', err);
      }

      // Devis en attente (pour workers uniquement)
      let hasPendingQuotes = false;
      try {
        const quotesResponse = await api.get('/quotes/my-quotes');
        hasPendingQuotes = quotesResponse.data.quotes?.some(
          q => q.status === 'pending'
        ) || false;
      } catch (err) {
        // Ignore l'erreur si l'utilisateur n'est pas un worker
      }

      // NE PAS afficher de badge pour les chantiers (trop vague)
      // Les utilisateurs doivent aller voir leurs chantiers de toute façon

      setBadges({
        messages: hasUnreadMessages,
        quotes: hasPendingQuotes,
        worksites: false, // Désactivé car pas assez spécifique
      });
    } catch (error) {
      console.error('Erreur récupération badges:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBadges();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }, [fetchBadges])
  );

  return badges;
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
      <Stack.Screen
        name="WorkerDetails"
        component={AuthWorkerDetailsScreen}
        options={{ headerShown: true, title: 'Informations détaillées' }}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{ headerShown: true, title: 'Vérification' }}
      />
    </Stack.Navigator>
  );
};

// Tabs pour les clients
const ClientTabNavigator = () => {
  const badges = useBadgeCounts();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let showBadge = false;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyRequests') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Worksites') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
            showBadge = badges.worksites;
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            showBadge = badges.messages;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <TabIconWithBadge iconName={iconName} color={color} size={size} showBadge={showBadge} />;
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
  const badges = useBadgeCounts();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let showBadge = false;

          if (route.name === 'Home') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AvailableRequests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MyQuotes') {
            iconName = focused ? 'document-attach' : 'document-attach-outline';
            showBadge = badges.quotes;
          } else if (route.name === 'Worksites') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
            showBadge = badges.worksites;
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            showBadge = badges.messages;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <TabIconWithBadge iconName={iconName} color={color} size={size} showBadge={showBadge} />;
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
          <Stack.Screen
            name="NotificationTest"
            component={NotificationTestScreen}
            options={{ headerShown: true, title: 'Test Notifications' }}
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
            name="Pricing"
            component={PricingScreen}
            options={{ headerShown: true, title: 'Abonnements' }}
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
          <Stack.Screen
            name="NotificationTest"
            component={NotificationTestScreen}
            options={{ headerShown: true, title: 'Test Notifications' }}
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
  tabIconContainer: {
    position: 'relative',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: COLORS.white || '#FFFFFF',
  },
});

export default AppNavigator;
