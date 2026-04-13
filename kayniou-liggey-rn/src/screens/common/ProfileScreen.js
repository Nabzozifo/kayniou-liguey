import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

// Avatar palette
const AVATAR_COLORS = ['#0F7B6C','#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981'];
const avatarColor = (name = '') => {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

// ── Animated menu item ───────────────────────────────────────────
const MenuItem = ({ icon, iconBg, iconColor, label, sub, danger, onPress, last }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
          {sub && <Text style={styles.menuSub}>{sub}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={17} color={COLORS.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Editable field ───────────────────────────────────────────────
const EditableField = ({ label, value, onChange, placeholder, keyboardType, disabled, hint }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {disabled ? (
      <>
        <View style={styles.fieldDisabled}>
          <Text style={styles.fieldDisabledText}>{value || '—'}</Text>
        </View>
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </>
    ) : onChange ? (
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    ) : (
      <View style={styles.fieldStatic}>
        <Text style={styles.fieldStaticText}>{value || '—'}</Text>
      </View>
    )}
  </View>
);

// ════════════════════════════════════════════════════════════════
const ProfileScreen = ({ navigation }) => {
  const { user, logout, setUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRadius, setIsEditingRadius] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(Number(user?.searchRadius) || 50);
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    searchRadius: Number(user?.searchRadius) || 50,
  });

  // entrance animations
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Rafraîchir les données utilisateur à chaque fois que l'écran est visible
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  useEffect(() => {
    if (user) {
      const r = Number(user.searchRadius) || 50;
      setProfile({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '', email: user.email || '', searchRadius: r });
      setSliderValue(r);
    }
  }, [user]);

  const handleSave = async () => {
    if (!profile.fullName.trim()) { Alert.alert('Erreur', 'Le nom complet est requis'); return; }
    setLoading(true);
    try {
      const data = { fullName: profile.fullName, phoneNumber: profile.phoneNumber };
      if (user.userType === 'client') data.searchRadius = profile.searchRadius;
      const res = await api.put('/auth/update-profile', data);
      if (res.data.success) {
        setUser({ ...user, ...res.data.user });
        setIsEditing(false);
        Alert.alert('Succès', 'Profil mis à jour');
      }
    } catch { Alert.alert('Erreur', 'Impossible de mettre à jour le profil'); }
    finally { setLoading(false); }
  };

  const handleSaveRadius = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/update-profile', { searchRadius: sliderValue });
      if (res.data.success) {
        setUser({ ...user, searchRadius: sliderValue });
        setIsEditingRadius(false);
        Alert.alert('Succès', 'Rayon mis à jour');
      }
    } catch { Alert.alert('Erreur', 'Impossible de mettre à jour le rayon'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Déconnexion', onPress: logout, style: 'destructive' },
  ]);

  const handleRequestDeletion = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Votre demande sera examinée par notre équipe sous 48h. Vous recevrez une notification. Toutes vos données seront effacées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer la demande',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/auth/request-deletion', { reason: 'Demande utilisateur' });
              if (res.data.success) {
                Alert.alert('Demande envoyée', res.data.message);
              } else {
                Alert.alert('Info', res.data.message);
              }
            } catch (err) {
              Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'envoyer la demande.');
            }
          },
        },
      ]
    );
  };

  const initials = (user?.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bgColor = avatarColor(user?.fullName || '');
  const isPremium = user?.subscription?.plan === 'premium' && user?.subscription?.status === 'active';

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>

      {/* ── Hero section ──────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Background decoration circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <Animated.View style={[styles.heroContent, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, { borderColor: isPremium ? '#F2C94C' : 'rgba(255,255,255,0.4)' }]}>
              <View style={[styles.avatar, { backgroundColor: bgColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            {/* Online indicator */}
            <View style={styles.onlineDot} />
            {/* Premium crown */}
            {isPremium && (
              <View style={styles.crownBadge}>
                <Ionicons name="trophy" size={11} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{user?.fullName}</Text>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.heroEmail}>{user?.email}</Text>

          {/* Role badge */}
          <View style={styles.roleBadge}>
            <Ionicons name={user?.userType === 'client' ? 'person' : 'hammer'} size={13} color={COLORS.primary} />
            <Text style={styles.roleText}>{user?.userType === 'client' ? 'Client' : 'Travailleur'}</Text>
          </View>
        </Animated.View>
      </View>

      {/* ── Personal info card ────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editPill} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={15} color={COLORS.primary} />
              <Text style={styles.editPillText}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        <EditableField
          label="Nom complet"
          value={profile.fullName}
          onChange={isEditing ? v => setProfile(p => ({ ...p, fullName: v })) : null}
          placeholder="Prénom et Nom"
        />
        <EditableField
          label="Téléphone"
          value={profile.phoneNumber}
          onChange={isEditing ? v => setProfile(p => ({ ...p, phoneNumber: v })) : null}
          placeholder="+221 XX XXX XX XX"
          keyboardType="phone-pad"
        />
        <EditableField
          label="Email"
          value={profile.email}
          disabled
          hint="L'email ne peut pas être modifié"
        />

        {isEditing && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setIsEditing(false); setProfile({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '', email: user?.email || '', searchRadius: Number(user?.searchRadius) || 50 }); }}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Search radius (clients) ───────────────────────── */}
      {user?.userType === 'client' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Rayon de recherche</Text>
            {!isEditingRadius && (
              <TouchableOpacity style={styles.editPill} onPress={() => setIsEditingRadius(true)}>
                <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                <Text style={styles.editPillText}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingRadius ? (
            <>
              <View style={styles.radiusControl}>
                <TouchableOpacity
                  style={styles.radiusStep}
                  onPress={() => setSliderValue(v => Math.max(5, v - 5))}
                >
                  <Ionicons name="remove" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.radiusValueBox}>
                  <Text style={styles.radiusValueNum}>{sliderValue}</Text>
                  <Text style={styles.radiusValueUnit}>km</Text>
                </View>
                <TouchableOpacity
                  style={styles.radiusStep}
                  onPress={() => setSliderValue(v => Math.min(100, v + 5))}
                >
                  <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.radiusHint}>Les travailleurs à plus de {sliderValue} km ne seront pas affichés</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSliderValue(Number(user?.searchRadius) || 50); setIsEditingRadius(false); }}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRadius} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.radiusInfo}>
              <View style={styles.radiusIconWrap}>
                <Ionicons name="location" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.radiusInfoText}>
                Travailleurs dans un rayon de <Text style={{ fontWeight: '700', color: COLORS.primary }}>{profile.searchRadius} km</Text> autour de vous
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Worker professional section ───────────────────── */}
      {user?.userType === 'worker' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Espace professionnel</Text>
          <View style={{ height: 8 }} />
          <MenuItem icon="stats-chart" iconBg="#E6F4F2" iconColor={COLORS.primary} label="Tableau de bord" sub="Statistiques et performances" onPress={() => navigation.navigate('WorkerDashboard')} />
          <MenuItem icon="briefcase-outline" iconBg="#FEF3C7" iconColor="#F59E0B" label="Modifier mon profil" sub="Métiers, expérience, tarifs..." onPress={() => navigation.navigate('EditWorkerProfile')} />
          <MenuItem
            icon="shield-checkmark-outline"
            iconBg={user?.isVerified ? '#D1FAE5' : '#FEE2E2'}
            iconColor={user?.isVerified ? '#059669' : '#EF4444'}
            label="Vérification d'identité"
            sub={user?.isVerified ? '✓ Identité vérifiée' : 'Requis pour postuler'}
            onPress={() => navigation.navigate('IdentityVerification')}
          />
          <MenuItem icon="trophy-outline" iconBg="#FEF3C7" iconColor="#F59E0B" label="Mon abonnement" sub={isPremium ? 'Premium actif' : 'Passer Premium'} onPress={() => navigation.navigate('Pricing')} last />
        </View>
      )}

      {/* ── Settings ──────────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={{ height: 8 }} />
        <MenuItem icon="notifications-outline" iconBg="#E0E7FF" iconColor="#6366F1" label="Notifications" onPress={() => navigation.navigate('NotificationsSettings')} />
        <MenuItem icon="shield-checkmark-outline" iconBg="#E0E7FF" iconColor="#6366F1" label="Confidentialité" onPress={() => navigation.navigate('Privacy')} />
        <MenuItem icon="lock-closed-outline" iconBg="#FEF3C7" iconColor="#F59E0B" label="Changer le mot de passe" onPress={() => navigation.navigate('ChangePassword')} />
        <MenuItem icon="book-outline" iconBg="#D1FAE5" iconColor="#059669" label="Manuel d'utilisation" onPress={() => navigation.navigate('UserManual')} />
        <MenuItem icon="help-circle-outline" iconBg="#DBEAFE" iconColor="#3B82F6" label="Aide & Support" onPress={() => navigation.navigate('Support')} last />
      </View>

      {/* ── Danger zone ───────────────────────────────────── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Zone sensible</Text>
        <View style={{ height: 8 }} />
        <MenuItem
          icon="trash-outline"
          iconBg="#FEE2E2"
          iconColor="#EF4444"
          label="Demander la suppression du compte"
          sub="Votre demande sera examinée sous 48h"
          danger
          onPress={handleRequestDeletion}
          last
        />
      </View>

      {/* ── Logout ────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.versionText}>Göllè v1.0.0</Text>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: -20,
  },
  heroContent: { paddingTop: 60, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  crownBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F2C94C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#fff' },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 14 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // ── Section card ──────────────────────────────────────────
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#F0FDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  editPillText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // ── Editable field ────────────────────────────────────────
  fieldWrap: { marginBottom: SPACING.sm },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  fieldStatic: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 11,
  },
  fieldStaticText: { fontSize: 15, color: COLORS.text },
  fieldDisabled: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 11,
  },
  fieldDisabledText: { fontSize: 15, color: COLORS.textLight },
  fieldHint: { fontSize: 11, color: COLORS.textLight, marginTop: 4, fontStyle: 'italic' },

  // ── Action row ────────────────────────────────────────────
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.xs,
  },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Radius control ────────────────────────────────────────
  radiusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.sm,
  },
  radiusStep: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    minWidth: 110,
    justifyContent: 'center',
  },
  radiusValueNum: { fontSize: 28, fontWeight: '800', color: '#fff' },
  radiusValueUnit: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  radiusHint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
  radiusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F0FDF9',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  radiusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusInfoText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },

  // ── Menu items ────────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  menuSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // ── Logout ────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Version ───────────────────────────────────────────────
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: SPACING.md },
});

export default ProfileScreen;
