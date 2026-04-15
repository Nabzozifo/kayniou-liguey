import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';

const ClientDetailsScreen = ({ route, navigation }) => {
  const { userId, clientName } = route.params;
  const [profile, setProfile]   = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get(`/client-profile/${userId}`).catch(() => null),
          api.get(`/client-profile/${userId}/stats`).catch(() => null),
        ]);
        if (pRes?.data?.success) setProfile(pRes.data.clientProfile || pRes.data.profile);
        if (sRes?.data?.success) setStats(sRes.data.stats);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, [userId]);

  const displayName = profile?.userId?.fullName || clientName || 'Client';
  const initial = (displayName[0] || 'C').toUpperCase();
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {joinDate && <Text style={styles.since}>Membre depuis {joinDate}</Text>}
        <View style={styles.typeBadge}>
          <Ionicons name="person-outline" size={13} color={COLORS.primary} />
          <Text style={styles.typeBadgeText}>Client</Text>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRequests ?? '—'}</Text>
            <Text style={styles.statLabel}>Demandes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedRequests ?? '—'}</Text>
            <Text style={styles.statLabel}>Complétées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeRequests ?? '—'}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
        </View>
      )}

      {/* Address */}
      {profile?.address ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{profile.address}</Text>
          </View>
        </View>
      ) : null}

      {/* Contact via chat */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => navigation.navigate('Chat', { workerId: userId, workerName: displayName })}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#fff" />
        <Text style={styles.chatBtnText}>Envoyer un message</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText:   { fontSize: 32, fontWeight: '700', color: '#fff' },
  name:         { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  since:        { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  typeBadgeText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText:  { flex: 1, fontSize: 14, color: '#374151' },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, margin: 16, marginTop: 4,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15,
  },
  chatBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default ClientDetailsScreen;
