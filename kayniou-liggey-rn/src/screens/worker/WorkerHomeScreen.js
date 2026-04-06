import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import MapsView from '../../components/MapsView';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const URGENCY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };

const CATEGORIES = [
  { id: 'plomberie',   label: 'Plomberie',   icon: 'water'         },
  { id: 'electricite', label: 'Électricité',  icon: 'flash'         },
  { id: 'menuiserie',  label: 'Menuiserie',   icon: 'hammer'        },
  { id: 'maconnerie',  label: 'Maçonnerie',   icon: 'construct'     },
  { id: 'peinture',    label: 'Peinture',     icon: 'color-palette' },
  { id: 'jardinage',   label: 'Jardinage',    icon: 'leaf'          },
  { id: 'nettoyage',   label: 'Nettoyage',    icon: 'sparkles'      },
];

const WorkerHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const headerSlide    = useRef(new Animated.Value(-100)).current;
  const headerOpacity  = useRef(new Animated.Value(0)).current;
  const fabScale       = useRef(new Animated.Value(0)).current;
  const availPulse     = useRef(new Animated.Value(1)).current;

  useEffect(() => { requestLocation(); }, []);
  useEffect(() => { if (location) updateLocation(); }, [location]);

  useFocusEffect(useCallback(() => {
    if (location) fetchRequests();
  }, [location, selectedCategory]));

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(fabScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true, delay: 300 }),
      ]).start();
    }
  }, [loading]);

  // Pulse animation for availability dot
  useEffect(() => {
    if (isAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(availPulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(availPulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      availPulse.stopAnimation();
      availPulse.setValue(1);
    }
  }, [isAvailable]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch { Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation'); }
    finally { setLoading(false); }
  };

  const updateLocation = async () => {
    try {
      await api.put(`/worker-profile/${user.id}/location`, { latitude: location.latitude, longitude: location.longitude });
    } catch { }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/service-requests/available-for-worker/${user.id}`);
      if (res.data.success) {
        let list = res.data.requests || [];
        if (selectedCategory) list = list.filter(r => r.categories?.includes(selectedCategory));
        setRequests(list);
        if (res.data.needsCategories) {
          Alert.alert('Complétez votre profil', 'Sélectionnez vos métiers pour voir les demandes.', [
            { text: 'Compléter', onPress: () => navigation.navigate('EditWorkerProfile') },
            { text: 'Plus tard', style: 'cancel' },
          ]);
        }
      }
    } catch (err) {
      if (err.response?.status === 400) {
        Alert.alert('Profil incomplet', 'Complétez votre profil pour voir les demandes.', [
          { text: 'Compléter', onPress: () => navigation.navigate('EditWorkerProfile') },
          { text: 'Plus tard', style: 'cancel' },
        ]);
        setRequests([]);
      }
    }
  };

  const toggleAvailability = async (val) => {
    try {
      setIsAvailable(val);
      await api.put(`/worker-profile/${user.id}/availability`, { isAvailable: val });
    } catch {
      setIsAvailable(!val);
      Alert.alert('Erreur', 'Impossible de changer la disponibilité');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Localisation en cours...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorWrap}>
        <View style={styles.errorIcon}>
          <Ionicons name="location-outline" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.errorTitle}>Localisation requise</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestLocation}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Full-screen map */}
      <MapsView
        style={StyleSheet.absoluteFill}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        markers={requests.map(r => ({
          id: r._id,
          coordinate: {
            latitude: r.location?.coordinates?.[1] || location.latitude,
            longitude: r.location?.coordinates?.[0] || location.longitude,
          },
          title: r.title || 'Demande',
          description: r.category,
        }))}
        onMarkerPress={marker => {
          const r = requests.find(x => x._id === marker.id);
          if (r) navigation.navigate('RequestDetails', { requestId: r._id });
        }}
      />

      {/* ── Top overlay ─────────────────────────────────────── */}
      <Animated.View style={[styles.topOverlay, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            {/* Pulsing dot */}
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: availPulse }], backgroundColor: isAvailable ? '#22C55E' : '#9CA3AF', opacity: 0.35 }]} />
              <View style={[styles.solidDot, { backgroundColor: isAvailable ? '#22C55E' : '#9CA3AF' }]} />
            </View>
            <View>
              <Text style={styles.statusTitle}>{isAvailable ? 'Disponible' : 'Indisponible'}</Text>
              <Text style={styles.statusSub}>{requests.length} demande{requests.length !== 1 ? 's' : ''} à proximité</Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
            thumbColor={isAvailable ? '#10B981' : '#9CA3AF'}
          />
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catPill, !selectedCategory && styles.catPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.catText, !selectedCategory && styles.catTextActive]}>Toutes</Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
            >
              <Ionicons name={c.icon} size={13} color={selectedCategory === c.id ? '#fff' : COLORS.primary} />
              <Text style={[styles.catText, selectedCategory === c.id && styles.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Requests count badge ───────────────────────────── */}
      {requests.length > 0 && (
        <View style={styles.countBadge}>
          <Ionicons name="document-text" size={15} color={COLORS.primary} />
          <Text style={styles.countText}>{requests.length} à proximité</Text>
        </View>
      )}

      {/* ── FAB — List view ───────────────────────────────── */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => navigation.navigate('AvailableRequests')}
          activeOpacity={0.85}
        >
          <Ionicons name="list" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.fabLabel}>Liste</Text>
      </Animated.View>

      {/* ── Chatbot FAB ───────────────────────────────────── */}
      <Animated.View style={[styles.fabChat, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabChatInner}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubbles" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8EDF0' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 40 },
  errorIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F0FDF9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 20 },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Top overlay ────────────────────────────────────────────
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.md,
  },

  // ── Status row ─────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseContainer: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  pulseDot: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
  solidDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  statusSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  // ── Category pills ─────────────────────────────────────────
  catScroll: { gap: 8, paddingBottom: 4 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  catTextActive: { color: '#fff' },

  // ── Count badge ────────────────────────────────────────────
  countBadge: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    ...SHADOWS.md,
  },
  countText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  // ── FAB list ───────────────────────────────────────────────
  fab: { position: 'absolute', right: SPACING.md, bottom: 32, alignItems: 'center' },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // ── FAB chatbot ────────────────────────────────────────────
  fabChat: { position: 'absolute', right: SPACING.md, bottom: 110 },
  fabChatInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2C94C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F2C94C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default WorkerHomeScreen;
