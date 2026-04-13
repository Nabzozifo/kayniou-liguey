import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import api from '../../services/api';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';

const EXAMPLES = [
  { icon: 'water',         text: 'J\'ai une fuite d\'eau au robinet de la cuisine' },
  { icon: 'flash',         text: 'Mon tableau électrique disjoncte souvent' },
  { icon: 'color-palette', text: 'Je veux repeindre mon salon en blanc' },
  { icon: 'construct',     text: 'Besoin d\'un plombier urgent pour déboucher mes toilettes' },
  { icon: 'snow',          text: 'Installer une climatisation dans ma chambre' },
];

const URGENCY_LABELS = { high: '🔴 Urgent', medium: '🟡 Normal', low: '🟢 Flexible' };

const SmartSearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [location, setLocation]       = useState(null);

  // ── Search ────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (description.trim().length < 10) {
      alert('Décrivez votre besoin en au moins 10 caractères');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let coords = location;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setLocation(coords);
        }
      }
      const response = await api.post('/worker-recommendations/semantic-search', {
        description: description.trim(),
        latitude:    coords?.latitude,
        longitude:   coords?.longitude,
        maxDistance: (user?.searchRadius || 50) * 1000,
        limit: 5,
      });
      setResult(response.data.success ? response.data : response.data);
    } catch {
      alert('Erreur lors de la recherche. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── Build prefill for CreateRequest ──────────────────────────
  const buildPrefill = (mode, workerId = null) => {
    const cats = result?.analysis?.detectedCategories || [];
    const urg  = result?.analysis?.urgency || 'medium';
    const title = cats.length > 0
      ? `Demande de ${cats[0].charAt(0).toUpperCase() + cats[0].slice(1)}`
      : 'Demande de service';
    return {
      title,
      description: description.trim(),
      categories:  cats,
      urgency:     urg,
      mode,
      invitedWorkerIds: workerId ? [workerId] : [],
    };
  };

  const goCreate = (mode, workerId = null) => {
    navigation.navigate('CreateRequest', { prefill: buildPrefill(mode, workerId) });
  };

  // ── Worker card ───────────────────────────────────────────────
  const WorkerCard = ({ worker, index }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerLeft}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        {worker.photoURL
          ? <Image source={{ uri: worker.photoURL }} style={styles.workerAvatar} />
          : (
            <View style={[styles.workerAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{(worker.fullName?.[0] || '?').toUpperCase()}</Text>
            </View>
          )
        }
        <View style={styles.workerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{worker.fullName}</Text>
            {worker.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            )}
            {worker.subscription?.plan === 'premium' && worker.subscription?.status === 'active' && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>TOP</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>{worker.rating?.toFixed(1) || 'N/A'}</Text>
            {worker.matchedCategories?.length > 0 && (
              <Text style={styles.categoryText} numberOfLines={1}>
                · {worker.matchedCategories.join(', ')}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreVal}>{worker.semanticScore?.toFixed(0)}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>

      {/* Propose directly */}
      <TouchableOpacity
        style={styles.proposeBtn}
        onPress={() => goCreate('direct_hire', worker._id)}
        activeOpacity={0.85}
      >
        <Ionicons name="send" size={14} color="#fff" />
        <Text style={styles.proposeBtnText}>Proposer</Text>
      </TouchableOpacity>
    </View>
  );

  // ── No result: offer creation options ─────────────────────────
  const NoResultActions = () => (
    <View style={styles.noResultBox}>
      <View style={styles.noResultIcon}>
        <Ionicons name="search-outline" size={36} color="#9CA3AF" />
      </View>
      <Text style={styles.noResultTitle}>Aucun professionnel trouvé</Text>
      <Text style={styles.noResultSub}>
        Pas de problème ! Publiez votre demande et les professionnels qualifiés viendront à vous.
      </Text>

      <View style={styles.offerBtns}>
        <TouchableOpacity
          style={[styles.offerBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => goCreate('auction')}
          activeOpacity={0.88}
        >
          <Ionicons name="people" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.offerBtnTitle}>Enchère publique</Text>
            <Text style={styles.offerBtnSub}>Comparez plusieurs devis</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.offerBtn, { backgroundColor: '#7C3AED' }]}
          onPress={() => goCreate('private_auction')}
          activeOpacity={0.88}
        >
          <Ionicons name="eye-off" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.offerBtnTitle}>Enchère privée</Text>
            <Text style={styles.offerBtnSub}>Devis confidentiels</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.prefillNote}>
        ✨ Le titre, la catégorie et la description seront pré-remplis par l'IA
      </Text>
    </View>
  );

  // ── Results action bar ────────────────────────────────────────
  const ResultActions = () => (
    <View style={styles.resultActionBar}>
      <Text style={styles.resultActionTitle}>Ou publiez une offre ouverte :</Text>
      <View style={styles.resultActionRow}>
        <TouchableOpacity
          style={[styles.smallOfferBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => goCreate('auction')}
        >
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text style={styles.smallOfferText}>Enchère publique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallOfferBtn, { backgroundColor: '#7C3AED' }]}
          onPress={() => goCreate('private_auction')}
        >
          <Ionicons name="eye-off-outline" size={16} color="#fff" />
          <Text style={styles.smallOfferText}>Enchère privée</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="sparkles" size={26} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Recherche Intelligente</Text>
        <Text style={styles.heroSub}>Décrivez votre besoin en langage naturel</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Input ── */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Ex: J'ai une fuite d'eau sous l'évier de la cuisine..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            {description.length > 0 && (
              <TouchableOpacity onPress={() => { setDescription(''); setResult(null); }}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, (loading || description.length < 10) && { opacity: 0.55 }]}
          onPress={handleSearch}
          disabled={loading || description.length < 10}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Trouver un professionnel</Text>
              </>
          }
        </TouchableOpacity>

        {/* ── Examples (only when no result) ── */}
        {!result && !loading && (
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>💡 Exemples</Text>
            {EXAMPLES.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleChip}
                onPress={() => setDescription(ex.text)}
              >
                <Ionicons name={ex.icon} size={16} color={COLORS.primary} />
                <Text style={styles.exampleText}>{ex.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── AI Analysis card ── */}
        {result?.analysis && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>🔍 Analyse IA</Text>
            <View style={styles.analysisPills}>
              {result.analysis.detectedCategories?.map(cat => (
                <View key={cat} style={styles.catPill}>
                  <Text style={styles.catPillText}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                </View>
              ))}
            </View>
            {result.analysis.urgency && (
              <Text style={styles.analysisUrgency}>
                {URGENCY_LABELS[result.analysis.urgency]}
              </Text>
            )}
          </View>
        )}

        {/* ── No category detected ── */}
        {result && !result.success && (
          <View style={styles.unknownBox}>
            <Ionicons name="help-circle" size={40} color="#F59E0B" />
            <Text style={styles.unknownTitle}>{result.message}</Text>
            {result.suggestions?.map((s, i) => (
              <Text key={i} style={styles.suggestionText}>• {s}</Text>
            ))}
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setDescription(''); setResult(null); }}>
              <Text style={styles.retryText}>Reformuler ma recherche</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Workers found ── */}
        {result?.success && result.count > 0 && (
          <View>
            <Text style={styles.resultsHeader}>
              {result.count} professionnel{result.count > 1 ? 's' : ''} trouvé{result.count > 1 ? 's' : ''}
            </Text>
            {result.recommendation && (
              <View style={styles.recommendationBanner}>
                <Ionicons name="bulb" size={16} color={COLORS.primary} />
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
              </View>
            )}
            {result.workers?.map((w, i) => <WorkerCard key={w._id} worker={w} index={i} />)}
            <ResultActions />
          </View>
        )}

        {/* ── No workers found ── */}
        {result?.success && result.count === 0 && <NoResultActions />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  scroll:  { flex: 1 },
  content: { padding: 16, paddingTop: 18 },

  // ── Input ─────────────────────────────────────────────────────
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  charCount: { fontSize: 11, color: '#9CA3AF' },
  searchBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Examples ─────────────────────────────────────────────────
  examplesSection: { marginBottom: 20 },
  examplesTitle:   { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleText: { flex: 1, fontSize: 13, color: '#374151' },

  // ── Analysis card ─────────────────────────────────────────────
  analysisCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  analysisTitle:   { fontSize: 13, fontWeight: '700', color: '#1E40AF', marginBottom: 8 },
  analysisPills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  catPill: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  catPillText:     { fontSize: 12, fontWeight: '700', color: '#fff' },
  analysisUrgency: { fontSize: 13, color: '#374151', marginTop: 2 },

  // ── Unknown / no category ─────────────────────────────────────
  unknownBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unknownTitle:  { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  suggestionText:{ fontSize: 13, color: '#6B7280', alignSelf: 'flex-start' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Results header ────────────────────────────────────────────
  resultsHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  recommendationText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // ── Worker card ───────────────────────────────────────────────
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  workerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText:     { fontSize: 11, fontWeight: '800', color: '#fff' },
  workerAvatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
  workerInfo:    { flex: 1 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  workerName:    { fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  premiumText:  { fontSize: 9, fontWeight: '800', color: '#fff' },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText:   { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  categoryText: { fontSize: 11, color: COLORS.primary, flexShrink: 1 },
  scoreBox:     { alignItems: 'center', marginRight: 4 },
  scoreVal:     { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  scoreLabel:   { fontSize: 10, color: '#9CA3AF' },
  proposeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  proposeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Result actions ────────────────────────────────────────────
  resultActionBar: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  resultActionTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  resultActionRow:   { flexDirection: 'row', gap: 8 },
  smallOfferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  smallOfferText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── No result actions ─────────────────────────────────────────
  noResultBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noResultIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noResultTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center' },
  noResultSub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  offerBtns:     { width: '100%', gap: 10, marginTop: 4 },
  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  offerBtnTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  offerBtnSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  prefillNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default SmartSearchScreen;
