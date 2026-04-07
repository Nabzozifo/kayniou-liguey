import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants';
import { NAV_THEME } from '../theme';
import api from '../services/api';

// Import des écrans
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileTypeSelectionScreen from '../screens/auth/ProfileTypeSelectionScreen';
import IdentityVerificationScreen from '../screens/auth/WorkerDetailsScreen';
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
import UserManualScreen from '../screens/common/UserManualScreen';
import CalendarScreen from '../screens/common/CalendarScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Custom Tab Bar ─────────────────────────────────────────────
const CustomTabBar = ({ state, descriptors: _descriptors, navigation, tabConfig, badges = {} }) => {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const cfg = tabConfig[route.name] || {};
        const hasBadge = badges[cfg.badgeKey];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            <View style={[tabStyles.iconWrap, isFocused && { backgroundColor: COLORS.primary }]}>
              <Ionicons
                name={isFocused ? cfg.iconFilled : cfg.icon}
                size={20}
                color={isFocused ? '#fff' : '#9CA3AF'}
              />
              {hasBadge && <View style={tabStyles.badge} />}
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

const CLIENT_TAB_CONFIG = {
  Home:          { icon: 'home-outline',           iconFilled: 'home',              label: 'Accueil',   badgeKey: null },
  MyRequests:    { icon: 'document-text-outline',  iconFilled: 'document-text',     label: 'Demandes',  badgeKey: null },
  Worksites:     { icon: 'construct-outline',      iconFilled: 'construct',          label: 'Chantiers', badgeKey: 'worksites' },
  Conversations: { icon: 'chatbubble-outline',     iconFilled: 'chatbubble',         label: 'Messages',  badgeKey: 'messages' },
  Profile:       { icon: 'person-circle-outline',  iconFilled: 'person-circle',      label: 'Profil',    badgeKey: null },
};

const WORKER_TAB_CONFIG = {
  Home:              { icon: 'map-outline',              iconFilled: 'map',              label: 'Carte',     badgeKey: null },
  AvailableRequests: { icon: 'grid-outline',             iconFilled: 'grid',             label: 'Offres',    badgeKey: null },
  MyQuotes:          { icon: 'receipt-outline',          iconFilled: 'receipt',          label: 'Devis',     badgeKey: 'quotes' },
  Worksites:         { icon: 'construct-outline',        iconFilled: 'construct',        label: 'Chantiers', badgeKey: 'worksites' },
  Conversations:     { icon: 'chatbubble-outline',       iconFilled: 'chatbubble',       label: 'Messages',  badgeKey: 'messages' },
  Profile:           { icon: 'person-circle-outline',    iconFilled: 'person-circle',    label: 'Profil',    badgeKey: null },
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
      tabBar={(props) => <CustomTabBar {...props} tabConfig={CLIENT_TAB_CONFIG} badges={badges} />}
      screenOptions={{
        headerShown: true,
        headerStyle: NAV_THEME.headerStyle,
        headerTitleStyle: NAV_THEME.headerTitleStyle,
        headerTintColor: NAV_THEME.headerTintColor,
      }}
    >
      <Tab.Screen name="Home" component={ClientHomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'Mes demandes' }} />
      <Tab.Screen name="Worksites" component={WorksitesListScreen} options={{ title: 'Chantiers' }} />
      <Tab.Screen name="Conversations" component={ConversationsListScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
};

// Tabs pour les travailleurs
const WorkerTabNavigator = () => {
  const badges = useBadgeCounts();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} tabConfig={WORKER_TAB_CONFIG} badges={badges} />}
      screenOptions={{
        headerShown: true,
        headerStyle: NAV_THEME.headerStyle,
        headerTitleStyle: NAV_THEME.headerTitleStyle,
        headerTintColor: NAV_THEME.headerTintColor,
      }}
    >
      <Tab.Screen name="Home" component={WorkerHomeScreen} options={{ title: 'Carte des Jobs' }} />
      <Tab.Screen name="AvailableRequests" component={AvailableRequestsScreen} options={{ title: 'Offres disponibles' }} />
      <Tab.Screen name="MyQuotes" component={MyQuotesScreen} options={{ title: 'Mes devis' }} />
      <Tab.Screen name="Worksites" component={WorksitesListScreen} options={{ title: 'Chantiers' }} />
      <Tab.Screen name="Conversations" component={ConversationsListScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
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
        headerStyle: NAV_THEME.headerStyle,
        headerTitleStyle: NAV_THEME.headerTitleStyle,
        headerTintColor: NAV_THEME.headerTintColor,
        headerBackTitleVisible: false,
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
            options={{ headerShown: true, title: 'Sélectionner des travailleurs' }}
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
          <Stack.Screen
            name="UserManual"
            component={UserManualScreen}
            options={{ headerShown: true, title: "Manuel d'utilisation" }}
          />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ headerShown: false }}
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
            name="IdentityVerification"
            component={IdentityVerificationScreen}
            options={{ headerShown: true, title: 'Vérification d\'identité' }}
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
          <Stack.Screen
            name="UserManual"
            component={UserManualScreen}
            options={{ headerShown: true, title: "Manuel d'utilisation" }}
          />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ headerShown: false }}
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

export default AppNavigator;
