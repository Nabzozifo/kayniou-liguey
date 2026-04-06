import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import MapsView from '../../components/MapsView';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Plomberie',    icon: 'water',         color: '#3B82F6' },
  { id: 'Électricité',  icon: 'flash',          color: '#F59E0B' },
  { id: 'Menuiserie',   icon: 'hammer',         color: '#8B5CF6' },
  { id: 'Maçonnerie',   icon: 'construct',      color: '#EF4444' },
  { id: 'Peinture',     icon: 'color-palette',  color: '#EC4899' },
  { id: 'Jardinage',    icon: 'leaf',           color: '#10B981' },
  { id: 'Nettoyage',    icon: 'sparkles',       color: '#06B6D4' },
];

const ClientHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // FAB animation
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabChatScale = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-100)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (location) fetchWorkers();
  }, [location, selectedCategory]);

  // Animate UI elements once location loads
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true, delay: 200 }),
        Animated.spring(fabChatScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true, delay: 300 }),
        Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch { }
    finally { setLoading(false); }
  };

  const fetchWorkers = async () => {
    try {
      const params = { latitude: location.latitude, longitude: location.longitude, radius: user?.searchRadius || 50, available: true };
      if (selectedCategory) params.category = selectedCategory;
      const res = await api.get('/worker-profile/nearby', { params });
      if (res.data.success) setWorkers(res.data.workers);
    } catch { }
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
        <Text style={styles.errorText}>Activez la localisation pour trouver des travailleurs près de chez vous.</Text>
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
        markers={workers.map(w => ({
          id: w._id,
          coordinate: {
            latitude: w.location?.coordinates?.[1] || location.latitude,
            longitude: w.location?.coordinates?.[0] || location.longitude,
          },
          title: w.userId?.fullName || 'Travailleur',
          description: w.categories?.join(', ') || '',
        }))}
        onMarkerPress={marker => {
          const w = workers.find(x => x._id === marker.id);
          if (w) navigation.navigate('WorkerProfile', { workerId: w._id });
        }}
      />

      {/* ── Top header overlay ─────────────────────────────── */}
      <Animated.View style={[styles.topOverlay, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SmartSearch')}
          activeOpacity={0.9}
        >
          <View style={styles.searchLeft}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <Text style={styles.searchPlaceholder}>Quel service cherchez-vous ?</Text>
          </View>
          <View style={styles.searchAI}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            <Text style={styles.searchAIText}>IA</Text>
          </View>
        </TouchableOpacity>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <TouchableOpacity
            style={[styles.catPill, !selectedCategory && styles.catPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>Tous</Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
            >
              <Ionicons
                name={c.icon}
                size={14}
                color={selectedCategory === c.id ? '#fff' : c.color}
              />
              <Text style={[styles.catPillText, selectedCategory === c.id && styles.catPillTextActive]}>
                {c.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Workers count badge ────────────────────────────── */}
      {workers.length > 0 && (
        <View style={styles.countBadge}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>
            {workers.length} travailleur{workers.length > 1 ? 's' : ''} à proximité
          </Text>
        </View>
      )}

      {/* ── Recenter ──────────────────────────────────────── */}
      <TouchableOpacity style={styles.recenterBtn}>
        <Ionicons name="locate" size={20} color={COLORS.text} />
      </TouchableOpacity>

      {/* ── FABs ──────────────────────────────────────────── */}
      <Animated.View style={[styles.fabChatbot, { transform: [{ scale: fabChatScale }] }]}>
        <TouchableOpacity
          style={styles.fabChatbotInner}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => navigation.navigate('CreateRequest')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.fabLabel}>Nouvelle demande</Text>
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
  errorTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
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

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchPlaceholder: { fontSize: 14, color: COLORS.textSecondary },
  searchAI: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  searchAIText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  // Category pills
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
  catPillText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  catPillTextActive: { color: '#fff' },

  // ── Workers count badge ─────────────────────────────────────
  countBadge: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    ...SHADOWS.md,
  },
  countDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  countText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  // ── Recenter button ─────────────────────────────────────────
  recenterBtn: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 180,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  // ── Chatbot FAB ────────────────────────────────────────────
  fabChatbot: {
    position: 'absolute',
    left: SPACING.md,
    bottom: 32,
  },
  fabChatbotInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2C94C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F2C94C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Main FAB ───────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 32,
    alignItems: 'center',
  },
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
});

export default ClientHomeScreen;
