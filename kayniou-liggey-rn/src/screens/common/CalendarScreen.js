import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Platform, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const DAY_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatTime = (dateStr, timeStr) => {
  if (timeStr) return timeStr;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
};

const getEventDate = (ws) => {
  const raw = ws.scheduledDate || ws.startTime || ws.preferredDate || ws.createdAt;
  return raw ? new Date(raw) : null;
};

const STATUS_CFG = {
  pending:     { label: 'En attente',  color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline' },
  in_progress: { label: 'En cours',    color: '#3B82F6', bg: '#EFF6FF', icon: 'hammer-outline' },
  completed:   { label: 'Terminé',     color: '#10B981', bg: '#F0FDF4', icon: 'checkmark-circle-outline' },
  cancelled:   { label: 'Annulé',      color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
};
const getStatus = s => STATUS_CFG[s] || { label: s, color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle-outline' };

// ─── Component ───────────────────────────────────────────────────────────────
const CalendarScreen = ({ navigation }) => {
  const { user } = useAuth();
  const today = new Date();

  const [view, setView] = useState('month'); // 'month' | 'list'
  const [worksites, setWorksites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month view state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  useFocusEffect(useCallback(() => { fetchWorksites(); }, []));

  const fetchWorksites = async () => {
    try {
      const r = await api.get('/worksites');
      if (r.data.success) setWorksites(r.data.worksites || []);
    } catch { setWorksites([]); }
    finally { setLoading(false); }
  };

  // ─── Month grid logic ───────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const offset = firstDay === 0 ? 6 : firstDay - 1; // start Monday
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };
  const goToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDate(today); };

  const getEventsForDay = (d) => {
    if (!d) return [];
    const target = new Date(calYear, calMonth, d);
    return worksites.filter(ws => { const ed = getEventDate(ws); return ed && isSameDay(ed, target); });
  };

  const selectedEvents = worksites.filter(ws => {
    const ed = getEventDate(ws); return ed && isSameDay(ed, selectedDate);
  });

  // ─── List view logic ────────────────────────────────────────────────────
  const sortedWorksites = [...worksites].sort((a, b) => {
    const da = getEventDate(a) || new Date(0);
    const db = getEventDate(b) || new Date(0);
    return da - db;
  });

  // Group by month
  const grouped = {};
  sortedWorksites.forEach(ws => {
    const d = getEventDate(ws);
    const key = d ? `${d.getFullYear()}-${d.getMonth()}` : 'no-date';
    if (!grouped[key]) grouped[key] = { label: d ? `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}` : 'Sans date', items: [] };
    grouped[key].items.push(ws);
  });
  const groupedList = Object.values(grouped);

  // ─── Render helpers ─────────────────────────────────────────────────────
  const EventCard = ({ ws, compact = false }) => {
    const isWorker = user?.id === ws.workerId?._id || user?._id === ws.workerId?._id || user?.id === ws.workerId;
    const other = isWorker ? ws.clientInfo : ws.workerInfo;
    const sc = getStatus(ws.status);
    const ed = getEventDate(ws);
    const timeStr = ws.scheduledTime || ws.availableTime || formatTime(ws.startTime || ws.preferredDate, null);
    const hasScheduledTime = ws.scheduledTime || ws.availableTime;

    return (
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        onPress={() => navigation.navigate('WorksiteDetails', { worksiteId: ws._id })}
        activeOpacity={0.85}
      >
        <View style={[styles.cardAccent, { backgroundColor: sc.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={compact ? 1 : 2}>{ws.title || 'Chantier'}</Text>
            <View style={[styles.badge, { backgroundColor: sc.bg }]}>
              <Ionicons name={sc.icon} size={11} color={sc.color} />
              <Text style={[styles.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            {ed && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                <Text style={styles.metaTxt}>
                  {ed.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {timeStr ? ` · ${timeStr}` : ''}
                </Text>
                {hasScheduledTime && (
                  <View style={styles.confirmedBadge}>
                    <Ionicons name="checkmark-circle" size={11} color={COLORS.primary} />
                    <Text style={styles.confirmedTxt}>Confirmé</Text>
                  </View>
                )}
              </View>
            )}
            {other?.name && (
              <View style={styles.metaRow}>
                <Ionicons name={isWorker ? 'person-outline' : 'hammer-outline'} size={12} color="#6B7280" />
                <Text style={styles.metaTxt} numberOfLines={1}>{other.name}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginRight: 12 }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendrier</Text>
          <Text style={styles.headerSub}>{worksites.length} chantier{worksites.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.todayBtn} onPress={goToday}>
            <Text style={styles.todayBtnTxt}>Aujourd'hui</Text>
          </TouchableOpacity>
          {/* View toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, view === 'month' && styles.toggleBtnActive]}
              onPress={() => setView('month')}
            >
              <Ionicons name="grid-outline" size={17} color={view === 'month' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
              onPress={() => setView('list')}
            >
              <Ionicons name="list-outline" size={17} color={view === 'list' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ══ MONTH VIEW ══ */}
      {view === 'month' && (
        <View style={{ flex: 1 }}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS_FR[calMonth]} {calYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAY_SHORT.map(d => <Text key={d} style={styles.dayHeaderTxt}>{d}</Text>)}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e-${i}`} style={styles.gridCell} />;
              const cellDate = new Date(calYear, calMonth, day);
              const isToday = isSameDay(cellDate, today);
              const isSel = isSameDay(cellDate, selectedDate);
              const events = getEventsForDay(day);
              const hasEvents = events.length > 0;
              const isPast = cellDate < today && !isToday;

              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={[styles.gridCell, isSel && styles.gridCellSel]}
                  onPress={() => setSelectedDate(cellDate)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayNum, isToday && styles.dayNumToday, isSel && styles.dayNumSel]}>
                    <Text style={[
                      styles.dayNumTxt,
                      isToday && styles.dayNumTxtToday,
                      isSel && styles.dayNumTxtSel,
                      isPast && styles.dayNumTxtPast,
                    ]}>{day}</Text>
                  </View>
                  {hasEvents && (
                    <View style={styles.dotRow}>
                      {events.slice(0, 3).map((_, j) => (
                        <View key={j} style={[styles.dot, isSel && styles.dotSel]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected day events */}
          <View style={styles.dayDetail}>
            <View style={styles.dayDetailHeader}>
              <Text style={styles.dayDetailTitle}>
                {isSameDay(selectedDate, today) ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              {selectedEvents.length > 0 && (
                <View style={styles.countBadge}><Text style={styles.countBadgeTxt}>{selectedEvents.length}</Text></View>
              )}
            </View>
            {selectedEvents.length === 0 ? (
              <View style={styles.emptyDay}>
                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyDayTxt}>Aucun chantier ce jour</Text>
              </View>
            ) : (
              <FlatList
                data={selectedEvents}
                keyExtractor={item => item._id}
                renderItem={({ item }) => <EventCard ws={item} />}
                contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      )}

      {/* ══ LIST VIEW ══ */}
      {view === 'list' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          {groupedList.length === 0 ? (
            <View style={styles.emptyFull}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={44} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucun chantier</Text>
              <Text style={styles.emptySub}>Vos chantiers apparaîtront ici une fois planifiés.</Text>
            </View>
          ) : (
            groupedList.map((group, gi) => (
              <View key={gi}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupDot} />
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupCount}>{group.items.length}</Text>
                </View>
                {group.items.map(ws => <EventCard key={ws._id} ws={ws} />)}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 0) + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  todayBtnTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 7 },
  toggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },

  // Month nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },

  // Day headers
  dayHeaders: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 4, paddingBottom: 6 },
  dayHeaderTxt: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', paddingHorizontal: 4, paddingBottom: 4 },
  gridCell: { width: `${100/7}%`, aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
  gridCellSel: { backgroundColor: '#F0FDF4', borderRadius: 8 },
  dayNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: COLORS.primary + '20' },
  dayNumSel: { backgroundColor: COLORS.primary },
  dayNumTxt: { fontSize: 13, fontWeight: '500', color: '#374151' },
  dayNumTxtToday: { color: COLORS.primary, fontWeight: '700' },
  dayNumTxtSel: { color: '#fff', fontWeight: '700' },
  dayNumTxtPast: { color: '#D1D5DB' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  dotSel: { backgroundColor: '#fff' },

  // Day detail
  dayDetail: { flex: 1, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  dayDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dayDetailTitle: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize', flex: 1 },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  emptyDay: { alignItems: 'center', paddingTop: 32, gap: 8 },
  emptyDayTxt: { fontSize: 13, color: '#9CA3AF' },

  // Event card
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardCompact: { marginBottom: 6 },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 19 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontSize: 10, fontWeight: '600' },
  cardMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaTxt: { fontSize: 12, color: '#6B7280', flex: 1 },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  confirmedTxt: { fontSize: 10, fontWeight: '600', color: COLORS.primary },

  // List view
  listContainer: { padding: 16, paddingBottom: 40 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  groupTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  groupCount: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },

  // Empty full
  emptyFull: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});

export default CalendarScreen;
