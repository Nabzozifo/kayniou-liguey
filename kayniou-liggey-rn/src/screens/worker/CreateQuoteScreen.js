import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform, Modal, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency, getCurrentRegion } from '../../config/regional';

// ─── Mini date/time picker (aucune dépendance externe) ───────────────────────
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const DAY_SHORT = ['Di','Lu','Ma','Me','Je','Ve','Sa'];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2,'0'));
const MINUTES = ['00','15','30','45'];

const MiniCalendar = ({ value, time, onChangeDate, onChangeTime, onClear, required }) => {
  const [showCal, setShowCal] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const today = new Date(); today.setHours(0,0,0,0);
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDay;
  const cells = [...Array(offset).fill(null), ...Array.from({length:daysInMonth}, (_,i)=>i+1)];

  const isSelected = d => value && d && value.getFullYear()===calYear && value.getMonth()===calMonth && value.getDate()===d;
  const isPast = d => d && new Date(calYear,calMonth,d) < today;

  const prevM = () => calMonth===0 ? (setCalMonth(11),setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextM = () => calMonth===11 ? (setCalMonth(0),setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const formatDate = d => d ? `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}` : null;

  return (
    <View>
      <View style={mcs.row}>
        <TouchableOpacity style={[mcs.btn, value && mcs.btnActive, required && !value && mcs.btnRequired]} onPress={() => setShowCal(true)}>
          <Ionicons name="calendar-outline" size={16} color={value ? COLORS.primary : required ? COLORS.error : COLORS.textSecondary} />
          <Text style={[mcs.btnTxt, value && mcs.btnTxtActive, required && !value && mcs.btnTxtReq]}>
            {value ? formatDate(value) : `Choisir une date${required ? ' *' : ''}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[mcs.timeBtn, time && mcs.btnActive, required && value && !time && mcs.btnRequired]}
          onPress={() => setShowTime(true)}
          disabled={!value}
        >
          <Ionicons name="time-outline" size={16} color={time ? COLORS.primary : COLORS.textLight} />
          <Text style={[mcs.btnTxt, time && mcs.btnTxtActive]}>{time || 'Heure'}</Text>
        </TouchableOpacity>
        {value && <TouchableOpacity onPress={onClear}><Ionicons name="close-circle" size={20} color="#9CA3AF" /></TouchableOpacity>}
      </View>

      <Modal visible={showCal} transparent animationType="fade">
        <TouchableOpacity style={mcs.overlay} activeOpacity={1} onPress={() => setShowCal(false)}>
          <TouchableOpacity activeOpacity={1} style={mcs.box}>
            <View style={mcs.calHdr}>
              <TouchableOpacity onPress={prevM} style={mcs.navBtn}><Ionicons name="chevron-back" size={18} color={COLORS.primary} /></TouchableOpacity>
              <Text style={mcs.calHdrTxt}>{MONTHS_FR[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextM} style={mcs.navBtn}><Ionicons name="chevron-forward" size={18} color={COLORS.primary} /></TouchableOpacity>
            </View>
            <View style={mcs.dayLabels}>
              {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d=><Text key={d} style={mcs.dayLbl}>{d}</Text>)}
            </View>
            <View style={mcs.grid}>
              {cells.map((d,i) => (
                <TouchableOpacity key={i} style={[mcs.cell, isSelected(d)&&mcs.cellSel, isPast(d)&&mcs.cellPast]} onPress={() => { if(d && !isPast(d)){ onChangeDate(new Date(calYear,calMonth,d)); setShowCal(false); }}} disabled={!d||isPast(d)}>
                  {d ? <Text style={[mcs.cellTxt, isSelected(d)&&mcs.cellTxtSel, isPast(d)&&mcs.cellTxtPast]}>{d}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTime} transparent animationType="fade">
        <TouchableOpacity style={mcs.overlay} activeOpacity={1} onPress={() => setShowTime(false)}>
          <TouchableOpacity activeOpacity={1} style={mcs.timeBox}>
            <Text style={mcs.timeTtl}>Choisir l'heure</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{maxHeight:260}}>
              {HOURS.map(h => MINUTES.map(m => {
                const t=`${h}:${m}`;
                return (
                  <TouchableOpacity key={t} style={[mcs.tOpt, time===t&&mcs.tOptSel]} onPress={() => { onChangeTime(t); setShowTime(false); }}>
                    <Text style={[mcs.tOptTxt, time===t&&mcs.tOptTxtSel]}>{t}</Text>
                  </TouchableOpacity>
                );
              }))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const mcs = StyleSheet.create({
  row: { flexDirection:'row', gap:8, alignItems:'center' },
  btn: { flex:1, flexDirection:'row', alignItems:'center', gap:6, borderWidth:1.5, borderColor:'#E5E7EB', borderRadius:10, paddingHorizontal:12, paddingVertical:10, backgroundColor:'#F9FAFB' },
  timeBtn: { width:90, flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderColor:'#E5E7EB', borderRadius:10, paddingHorizontal:10, paddingVertical:10, backgroundColor:'#F9FAFB', justifyContent:'center' },
  btnActive: { borderColor:COLORS.primary, backgroundColor:COLORS.primaryLight||'#F0FDF4' },
  btnRequired: { borderColor:COLORS.error||'#EF4444', backgroundColor:'#FEF2F2' },
  btnTxt: { fontSize:12, color:COLORS.textSecondary, flex:1 },
  btnTxtActive: { color:COLORS.primary, fontWeight:'600' },
  btnTxtReq: { color:COLORS.error||'#EF4444' },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' },
  box: { backgroundColor:'#fff', borderRadius:20, padding:16, width:300 },
  calHdr: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  calHdrTxt: { fontSize:15, fontWeight:'700', color:'#111827', textTransform:'capitalize' },
  navBtn: { width:32, height:32, borderRadius:16, backgroundColor:'#F0FDF4', alignItems:'center', justifyContent:'center' },
  dayLabels: { flexDirection:'row', marginBottom:4 },
  dayLbl: { flex:1, textAlign:'center', fontSize:10, fontWeight:'600', color:'#9CA3AF', textTransform:'uppercase' },
  grid: { flexDirection:'row', flexWrap:'wrap' },
  cell: { width:`${100/7}%`, aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:6 },
  cellSel: { backgroundColor:COLORS.primary },
  cellPast: { opacity:0.3 },
  cellTxt: { fontSize:13, fontWeight:'500', color:'#111827' },
  cellTxtSel: { color:'#fff', fontWeight:'700' },
  cellTxtPast: { color:'#9CA3AF' },
  timeBox: { backgroundColor:'#fff', borderRadius:20, padding:16, width:180, maxHeight:340 },
  timeTtl: { fontSize:14, fontWeight:'700', color:'#111827', textAlign:'center', marginBottom:10 },
  tOpt: { paddingVertical:9, paddingHorizontal:14, borderRadius:8, marginBottom:2 },
  tOptSel: { backgroundColor:COLORS.primary },
  tOptTxt: { fontSize:14, textAlign:'center', color:'#374151' },
  tOptTxtSel: { color:'#fff', fontWeight:'700' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const CreateQuoteScreen = ({ route, navigation }) => {
  const { requestId, editMode, quoteData, quoteId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    price: '',
    estimatedDuration: '',
    description: '',
    servicesIncluded: [],
    additionalNotes: '',
    availableDate: null,
    availableTime: null,
  });

  useEffect(() => {
    fetchRequest();
    if (editMode && quoteData) {
      setFormData({
        price: quoteData.price?.toString() || '',
        estimatedDuration: quoteData.estimatedDuration?.toString() || '',
        description: quoteData.description || '',
        servicesIncluded: quoteData.servicesIncluded || [],
        additionalNotes: quoteData.additionalNotes || '',
        availableDate: quoteData.availableDate ? new Date(quoteData.availableDate) : null,
        availableTime: quoteData.availableTime || null,
      });
    }
  }, [requestId, editMode, quoteData]);

  useEffect(() => {
    navigation.setOptions({ title: editMode ? 'Modifier le Devis' : 'Créer un Devis' });
  }, [navigation, editMode]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/service-requests/${requestId}`);
      if (response.data.success) setRequest(response.data.serviceRequest);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la demande');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // La demande a-t-elle déjà une date fixée par le client ?
  const clientHasDate = request?.preferredDate != null;

  const addService = () => {
    if (!skillInput.trim()) return;
    setFormData(prev => ({ ...prev, servicesIncluded: [...prev.servicesIncluded, skillInput.trim()] }));
    setSkillInput('');
  };

  const removeService = (i) => setFormData(prev => ({ ...prev, servicesIncluded: prev.servicesIncluded.filter((_,j)=>j!==i) }));

  const validateForm = () => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Erreur', 'Le prix est requis et doit être supérieur à 0'); return false;
    }
    if (!formData.estimatedDuration || parseFloat(formData.estimatedDuration) <= 0) {
      Alert.alert('Erreur', 'La durée estimée est requise'); return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise'); return false;
    }
    // Date obligatoire seulement si le client n'a pas fixé de date
    if (!clientHasDate && !formData.availableDate) {
      Alert.alert('Erreur', 'Vous devez proposer une date d\'intervention (le client n\'en a pas fixé)'); return false;
    }
    if (!clientHasDate && formData.availableDate && !formData.availableTime) {
      Alert.alert('Erreur', 'Précisez également l\'heure d\'intervention'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const submitData = {
        requestId,
        workerId: user.id,
        workerName: user.fullName,
        price: parseFloat(formData.price),
        estimatedDuration: parseFloat(formData.estimatedDuration),
        description: formData.description,
        servicesIncluded: formData.servicesIncluded,
        additionalNotes: formData.additionalNotes,
        availableDate: formData.availableDate || null,
        availableTime: formData.availableTime || null,
        status: 'pending',
      };

      let response;
      if (editMode && quoteId) {
        response = await api.put(`/quotes/${quoteId}`, submitData);
      } else {
        response = await api.post('/quotes', submitData);
      }

      if (response.data.success) {
        Alert.alert('Succès', editMode ? 'Devis modifié' : 'Devis soumis avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de soumettre le devis');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !request) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const formatClientDate = (d, t) => {
    const date = new Date(d);
    const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `${day}${t ? ` à ${t}` : ''}`;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Request Summary */}
      <View style={styles.summary}>
        <Ionicons name="document-text" size={22} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle} numberOfLines={1}>{request.title}</Text>
          <Text style={styles.summaryBudget}>Budget : {formatCurrency(request.estimatedBudget, getCurrentRegion(request.clientId?.phoneNumber).code)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Date d'intervention ── */}
        <View style={styles.dateSection}>
          <View style={styles.dateSectionHeader}>
            <Ionicons name="calendar" size={18} color={clientHasDate ? COLORS.primary : '#F59E0B'} />
            <Text style={styles.dateSectionTitle}>
              {clientHasDate ? 'Date fixée par le client' : 'Date d\'intervention requise'}
            </Text>
            {!clientHasDate && <View style={styles.requiredBadge}><Text style={styles.requiredBadgeTxt}>Obligatoire</Text></View>}
          </View>

          {clientHasDate ? (
            <View style={styles.clientDateBox}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.clientDateTxt}>
                {formatClientDate(request.preferredDate, request.preferredTime)}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.dateHint}>
                Le client n'a pas fixé de date. Vous devez proposer quand vous pouvez intervenir.
              </Text>
              <MiniCalendar
                value={formData.availableDate}
                time={formData.availableTime}
                onChangeDate={d => setFormData(p => ({ ...p, availableDate: d }))}
                onChangeTime={t => setFormData(p => ({ ...p, availableTime: t }))}
                onClear={() => setFormData(p => ({ ...p, availableDate: null, availableTime: null }))}
                required
              />
            </>
          )}
        </View>

        {/* ── Prix ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="cash-outline" size={15} /> Prix proposé ({getCurrentRegion(request.clientId?.phoneNumber).currency.code}) *
          </Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={t => setFormData(p => ({ ...p, price: t }))}
            placeholder="Ex: 45000"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
          />
          {formData.price && request.estimatedBudget ? (
            <View style={[styles.priceCmp, parseFloat(formData.price) <= request.estimatedBudget ? styles.priceCmpOk : styles.priceCmpWarn]}>
              <Ionicons name={parseFloat(formData.price) <= request.estimatedBudget ? 'checkmark-circle' : 'alert-circle'} size={14} color={parseFloat(formData.price) <= request.estimatedBudget ? COLORS.success : COLORS.warning} />
              <Text style={{ fontSize: 12, color: parseFloat(formData.price) <= request.estimatedBudget ? COLORS.success : COLORS.warning }}>
                {parseFloat(formData.price) <= request.estimatedBudget ? 'Dans le budget' : `Dépassement de ${formatCurrency(parseFloat(formData.price) - request.estimatedBudget, getCurrentRegion(request.clientId?.phoneNumber).code)}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Durée ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}><Ionicons name="time-outline" size={15} /> Durée estimée (heures) *</Text>
          <TextInput
            style={styles.input}
            value={formData.estimatedDuration}
            onChangeText={t => setFormData(p => ({ ...p, estimatedDuration: t }))}
            placeholder="Ex: 4"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
          />
        </View>

        {/* ── Description ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}><Ionicons name="reader-outline" size={15} /> Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={t => setFormData(p => ({ ...p, description: t }))}
            placeholder="Comment allez-vous réaliser ce travail ?"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ── Services inclus ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}><Ionicons name="checkmark-circle-outline" size={15} /> Services inclus</Text>
          <View style={styles.serviceRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Ex: Fourniture matériaux"
              placeholderTextColor={COLORS.textLight}
              onSubmitEditing={addService}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addService}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {formData.servicesIncluded.map((s, i) => (
            <View key={i} style={styles.chip}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
              <Text style={styles.chipTxt}>{s}</Text>
              <TouchableOpacity onPress={() => removeService(i)}>
                <Ionicons name="close-circle" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Notes ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}><Ionicons name="create-outline" size={15} /> Notes additionnelles</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.additionalNotes}
            onChangeText={t => setFormData(p => ({ ...p, additionalNotes: t }))}
            placeholder="Garanties, conditions, disponibilités…"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name={editMode ? 'checkmark-circle' : 'paper-plane'} size={20} color="#fff" />
              <Text style={styles.submitTxt}>{editMode ? 'Modifier le devis' : 'Soumettre le devis'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  summaryBudget: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 32 },

  // Date section
  dateSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dateSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  requiredBadge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  requiredBadgeTxt: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  clientDateBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primaryLight || '#F0FDF4', borderRadius: 10, padding: 12 },
  clientDateTxt: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  dateHint: { fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 17 },

  // Form
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text },
  textArea: { height: 110, paddingTop: 12 },
  priceCmp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  priceCmpOk: { backgroundColor: '#DCFCE7' },
  priceCmpWarn: { backgroundColor: '#FEF9C3' },
  serviceRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addBtn: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  chipTxt: { flex: 1, fontSize: 13, color: COLORS.text },

  // Footer
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14 },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default CreateQuoteScreen;
