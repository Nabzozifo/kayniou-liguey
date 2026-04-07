import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ─── Helpers ────────────────────────────────────────────────────
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const getWeekDays = (refDate) => {
  const start = new Date(refDate);
  const day = start.getDay(); // 0=dim
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // lundi
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatMonthYear = (date) =>
  date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

const formatTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// ─── Status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: 'time',
  },
  in_progress: {
    label: 'En cours',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: 'hammer',
  },
  completed: {
    label: 'Terminé',
    color: '#10B981',
    bgColor: '#F0FDF4',
    icon: 'checkmark-circle',
  },
  cancelled: {
    label: 'Annulé',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: 'close-circle',
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: status,
    color: COLORS.textSecondary,
    bgColor: COLORS.backgroundDark,
    icon: 'help-circle',
  };

// ─── Component ───────────────────────────────────────────────────
const CalendarScreen = ({ navigation }) => {
  const { user } = useAuth();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(today);
  const [weekRef, setWeekRef] = useState(today);
  const [worksites, setWorksites] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDays = getWeekDays(weekRef);

  useFocusEffect(
    useCallback(() => {
      fetchWorksites();
    }, [])
  );

  const fetchWorksites = async () => {
    try {
      const response = await api.get('/worksites');
      if (response.data.success) {
        setWorksites(response.data.worksites || []);
      }
    } catch (error) {
      console.error('Erreur calendrier:', error);
      setWorksites([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter events for a given day ───────────────────────────
  const getEventsForDay = (date) =>
    worksites.filter((ws) => {
      const ref = ws.startTime || ws.scheduledDate || ws.createdAt;
      if (!ref) return false;
      return isSameDay(new Date(ref), date);
    });

  const dayHasEvents = (date) => getEventsForDay(date).length > 0;
  const selectedEvents = getEventsForDay(selectedDate);

  // ─── Week navigation ─────────────────────────────────────────
  const goToPrevWeek = () => {
    const prev = new Date(weekRef);
    prev.setDate(prev.getDate() - 7);
    setWeekRef(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekRef);
    next.setDate(next.getDate() + 7);
    setWeekRef(next);
  };

  // ─── Render ──────────────────────────────────────────────────
  const renderDayCell = (date, index) => {
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, today);
    const hasEvents = dayHasEvents(date);

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayCell, isSelected && styles.dayCellSelected]}
        onPress={() => setSelectedDate(date)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
          {DAY_LABELS[index]}
        </Text>
        <View
          style={[
            styles.dayNumber,
            isSelected && styles.dayNumberSelected,
            isToday && !isSelected && styles.dayNumberToday,
          ]}
        >
          <Text
            style={[
              styles.dayNumberText,
              isSelected && styles.dayNumberTextSelected,
              isToday && !isSelected && styles.dayNumberTextToday,
            ]}
          >
            {date.getDate()}
          </Text>
        </View>
        {hasEvents && (
          <View
            style={[
              styles.eventDot,
              { backgroundColor: isSelected ? COLORS.white : COLORS.primary },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderEventCard = ({ item: worksite }) => {
    const isWorker = user?.id === worksite.workerId?._id || user?._id === worksite.workerId?._id;
    const otherPerson = isWorker ? worksite.clientInfo : worksite.workerInfo;
    const statusCfg = getStatusConfig(worksite.status);
    const ref = worksite.startTime || worksite.scheduledDate || worksite.createdAt;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate('WorksiteDetails', { worksiteId: worksite._id })
        }
        activeOpacity={0.85}
      >
        {/* Accent bar */}
        <View style={[styles.eventAccent, { backgroundColor: statusCfg.color }]} />

        <View style={styles.eventBody}>
          {/* Top row */}
          <View style={styles.eventTopRow}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {worksite.title || 'Chantier'}
            </Text>
            <View style={[styles.eventBadge, { backgroundColor: statusCfg.bgColor }]}>
              <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
              <Text style={[styles.eventBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Time */}
          {ref ? (
            <View style={styles.eventMetaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.eventMetaText}>{formatTime(ref)}</Text>
            </View>
          ) : null}

          {/* Other person */}
          {otherPerson && (
            <View style={styles.eventMetaRow}>
              <Ionicons
                name={isWorker ? 'person-outline' : 'hammer-outline'}
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.eventMetaText} numberOfLines={1}>
                {otherPerson.name || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} style={styles.eventChevron} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="calendar-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucun chantier ce jour-là</Text>
      <Text style={styles.emptySubtitle}>
        Sélectionnez un autre jour ou revenez plus tard.
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendrier</Text>
        <View style={styles.monthBadge}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.monthText}>{formatMonthYear(selectedDate)}</Text>
        </View>
      </View>

      {/* ── Week strip ── */}
      <View style={styles.weekContainer}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.weekNavBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.weekStrip}>
          {weekDays.map((date, index) => renderDayCell(date, index))}
        </View>

        <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Events section ── */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsSectionTitle}>
            {isSameDay(selectedDate, today)
              ? "Aujourd'hui"
              : selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
          </Text>
          {selectedEvents.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedEvents.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={selectedEvents}
            renderItem={renderEventCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.eventsList}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 56 : StatusBar.currentHeight + 12,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },

  // Week strip
  weekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekNavBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  weekStrip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xxs,
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    minWidth: 38,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  dayNumber: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dayNumberToday: {
    backgroundColor: COLORS.primaryLight,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayNumberTextSelected: {
    color: COLORS.white,
  },
  dayNumberTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    marginTop: 3,
  },

  // Events section
  eventsSection: {
    flex: 1,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsList: {
    padding: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: 32,
  },

  // Event card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  eventAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  eventBody: {
    flex: 1,
    padding: SPACING.sm,
    gap: 6,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventChevron: {
    marginRight: SPACING.sm,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default CalendarScreen;
