import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRadius, setIsEditingRadius] = useState(false); // Nouvel état pour édition du rayon séparée
  const [loading, setLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(Number(user?.searchRadius) || 50); // État séparé pour le slider
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    searchRadius: Number(user?.searchRadius) || 50,
  });

  // Synchroniser le profil avec les données user
  useEffect(() => {
    if (user) {
      const radius = Number(user.searchRadius) || 50;
      setProfile({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        searchRadius: radius,
      });
      setSliderValue(radius);
    }
  }, [user]);

  // Initialiser la valeur du slider quand on ouvre le mode d'édition
  useEffect(() => {
    if (isEditingRadius) {
      const currentRadius = Number(profile.searchRadius) || 50;
      setSliderValue(currentRadius);
    }
  }, [isEditingRadius]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    if (!profile.fullName.trim()) {
      Alert.alert('Erreur', 'Le nom complet est requis');
      return;
    }

    if (!profile.phoneNumber.trim()) {
      Alert.alert('Erreur', 'Le numéro de téléphone est requis');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
      };

      // Ajouter searchRadius seulement pour les clients
      if (user.userType === 'client') {
        updateData.searchRadius = profile.searchRadius;
      }

      const response = await api.put('/auth/update-profile', updateData);

      if (response.data.success) {
        setUser({ ...user, ...response.data.user });
        setIsEditing(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile({
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      email: user?.email || '',
      searchRadius: Number(user?.searchRadius) || 50,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient effect */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
            </View>
            {user?.subscription?.plan === 'premium' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="trophy" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* User Info */}
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* User Type Badge */}
          <View style={styles.typeBadge}>
            <Ionicons
              name={user?.userType === 'client' ? 'person' : 'hammer'}
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.typeBadgeText}>
              {user?.userType === 'client' ? 'Client' : 'Travailleur'}
            </Text>
          </View>
        </View>
      </View>

      {/* Profile Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informations Personnelles</Text>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Editable Fields */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} /> Nom complet
          </Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={profile.fullName}
              onChangeText={(text) => setProfile({ ...profile, fullName: text })}
              placeholder="Votre nom complet"
              placeholderTextColor={COLORS.textLight}
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.fullName}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} /> Téléphone
          </Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={profile.phoneNumber}
              onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
              placeholder="+221 XX XXX XX XX"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.phoneNumber || 'Non renseigné'}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            <Ionicons name="mail-outline" size={16} color={COLORS.textSecondary} /> Email
          </Text>
          <Text style={[styles.fieldValue, styles.fieldValueDisabled]}>{profile.email}</Text>
          <Text style={styles.fieldHint}>L'email ne peut pas être modifié</Text>
        </View>

        {/* Edit Actions */}
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Client Search Preferences */}
      {user?.userType === 'client' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Préférences de Recherche</Text>
            {!isEditingRadius && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingRadius(true)}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.field}>
            <View style={styles.radiusHeader}>
              <Text style={styles.fieldLabel}>
                <Ionicons name="map-outline" size={16} color={COLORS.textSecondary} /> Rayon de recherche
              </Text>
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusValue}>{isEditingRadius ? sliderValue : (profile.searchRadius || 50)} km</Text>
              </View>
            </View>

            {isEditingRadius ? (
              <>
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.max(5, sliderValue - 5);
                      setSliderValue(newValue);
                      setProfile({ ...profile, searchRadius: newValue });
                    }}
                  >
                    <Ionicons name="remove" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                  <View style={styles.sliderValueBox}>
                    <Text style={styles.sliderValueText}>{sliderValue} km</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.min(100, sliderValue + 5);
                      setSliderValue(newValue);
                      setProfile({ ...profile, searchRadius: newValue });
                    }}
                  >
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.fieldHint}>
                  Les travailleurs à plus de {sliderValue}km ne seront pas affichés dans les résultats
                </Text>
              </>
            ) : (
              <View style={styles.radiusInfoContainer}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
                <Text style={styles.radiusInfo}>
                  Vous verrez les travailleurs dans un rayon de {profile.searchRadius || 50}km autour de votre position
                </Text>
              </View>
            )}
          </View>

          {/* Radius Edit Actions */}
          {isEditingRadius && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  const originalRadius = Number(user?.searchRadius) || 50;
                  setSliderValue(originalRadius);
                  setProfile({ ...profile, searchRadius: originalRadius });
                  setIsEditingRadius(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={async () => {
                  setLoading(true);
                  try {
                    const response = await api.put('/auth/update-profile', {
                      searchRadius: sliderValue,
                    });
                    if (response.data.success) {
                      setUser({ ...user, searchRadius: sliderValue });
                      setIsEditingRadius(false);
                      Alert.alert('Succès', 'Rayon de recherche mis à jour');
                    }
                  } catch (error) {
                    console.error('Erreur mise à jour rayon:', error);
                    Alert.alert('Erreur', 'Impossible de mettre à jour le rayon');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Worker Profile Actions */}
      {user?.userType === 'worker' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profil Professionnel</Text>

          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => navigation.navigate('WorkerDashboard')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuItemText}>Tableau de Bord</Text>
                <Text style={styles.menuItemSubtext}>Statistiques et performances</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditWorkerProfile')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.menuItemText}>Modifier le Profil</Text>
                <Text style={styles.menuItemSubtext}>Métiers, expérience, description...</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('IdentityVerification')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuItemText}>Vérification d'identité</Text>
                <Text style={styles.menuItemSubtext}>
                  {user?.isVerified ? '✓ Identité vérifiée' : 'Requis pour postuler'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Pricing')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#FFD700' + '30' }]}>
                <Ionicons name="trophy-outline" size={20} color="#B8860B" />
              </View>
              <View>
                <Text style={styles.menuItemText}>Mon Abonnement</Text>
                <Text style={styles.menuItemSubtext}>
                  {user?.subscription?.plan === 'premium' ? 'Premium (Actif)' : 'Basique (Passer Premium)'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paramètres</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('NotificationsSettings')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('NotificationTest')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FF3B30' + '20' }]}>
              <Ionicons name="flask" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.menuItemText}>Test Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Privacy')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.menuItemText}>Confidentialité</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('UserManual')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="book-outline" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.menuItemText}>Manuel d'utilisation</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Support')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.menuItemText}>Aide & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    backgroundColor: COLORS.primary,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.primaryLight,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 10,
  },
  fieldValueDisabled: {
    color: COLORS.textLight,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dashboardButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  radiusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 16,
  },
  sliderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValueBox: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  radiusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  radiusInfo: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default ProfileScreen;
