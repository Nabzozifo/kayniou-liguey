import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import api, { authService } from '../../services/api';

const CODE_LENGTH = 6;

const OTPScreen = ({ route, navigation }) => {
  const { phoneNumber, userData } = route.params;
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(60);
  const [wrongAnim] = useState(new Animated.Value(0));

  const inputRefs = useRef(Array(CODE_LENGTH).fill(null).map(() => React.createRef()));

  // Ring progress for timer
  const ringAnim = useRef(new Animated.Value(1)).current;
  const dotScale = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(dotScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();
    sendOTP();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Animate ring as timer counts down
  useEffect(() => {
    Animated.timing(ringAnim, {
      toValue: timer / 60,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [timer]);

  const sendOTP = async () => {
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
      setTimer(60);
    } catch (err) {
      if (err.code === 'auth/missing-client-identifier') {
        setTimer(60);
        setConfirm(null);
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer le code SMS. ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (val, index) => {
    const d = [...digits];
    d[index] = val.slice(-1); // only last char
    setDigits(d);
    if (val && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.current?.focus();
    }
    // Auto-verify when full
    if (val && index === CODE_LENGTH - 1) {
      const fullCode = [...d].join('');
      if (fullCode.length === CODE_LENGTH) verify(fullCode);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    }
  };

  const shakeWrong = () => {
    Animated.sequence([
      Animated.timing(wrongAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const verify = async (code) => {
    const finalCode = code || digits.join('');
    if (finalCode.length < CODE_LENGTH) {
      Alert.alert('Code incomplet', `Entrez les ${CODE_LENGTH} chiffres`);
      return;
    }
    setVerifying(true);
    try {
      if (finalCode === '123456') {
        // test bypass
      } else if (confirm) {
        await confirm.confirm(finalCode);
      } else {
        throw new Error('Code invalide');
      }
      navigation.navigate('ProfileTypeSelection', {
        userData: { ...userData, phoneNumber, firebaseToken: 'valid' },
      });
    } catch {
      shakeWrong();
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.current?.focus();
      Alert.alert('Code incorrect', 'Vérifiez le code reçu par SMS et réessayez.');
    } finally {
      setVerifying(false);
    }
  };

  const filledCount = digits.filter(Boolean).length;
  const progress = filledCount / CODE_LENGTH;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Green hero ──────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Animated icon */}
        <Animated.View style={[styles.iconRing, { transform: [{ scale: dotScale }] }]}>
          <Ionicons name="phone-portrait" size={36} color={COLORS.primary} />
        </Animated.View>

        <Text style={styles.heroTitle}>Code de vérification</Text>
        <Text style={styles.heroSub}>
          Nous avons envoyé un SMS au{'\n'}
          <Text style={styles.heroPhone}>{phoneNumber}</Text>
        </Text>
      </View>

      {/* ── Card ────────────────────────────────────────── */}
      <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>

        {/* OTP boxes */}
        <Animated.View style={[styles.boxes, { transform: [{ translateX: wrongAnim }] }]}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                styles.box,
                d && styles.boxFilled,
                i === filledCount && styles.boxActive,
              ]}
            >
              <TextInput
                ref={inputRefs.current[i]}
                style={styles.boxInput}
                value={d}
                onChangeText={v => handleDigitChange(v, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!verifying}
                caretHidden
              />
              {!d && i === filledCount && <View style={styles.cursor} />}
            </View>
          ))}
        </Animated.View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                d ? styles.progressDotFilled : styles.progressDotEmpty,
              ]}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            filledCount < CODE_LENGTH && styles.verifyBtnDisabled,
          ]}
          onPress={() => verify(null)}
          disabled={filledCount < CODE_LENGTH || verifying}
          activeOpacity={0.85}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.verifyText}>Vérifier le code</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Timer + resend */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <View style={styles.timerWrap}>
              {/* Mini circular progress */}
              <View style={styles.timerRing}>
                <Text style={styles.timerNum}>{timer}s</Text>
              </View>
              <Text style={styles.timerLabel}>Renvoyer dans {timer}s</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={sendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                  <Text style={styles.resendText}>Renvoyer le code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info tip */}
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={15} color={COLORS.textLight} />
          <Text style={styles.tipText}>
            En mode test, entrez <Text style={{ fontWeight: '700' }}>123456</Text>
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 56,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },
  heroPhone: { fontWeight: '800', color: '#F2C94C' },

  // ── Card ──────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -28,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    alignItems: 'center',
  },

  // ── OTP boxes ─────────────────────────────────────────────
  boxes: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  boxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF9',
  },
  boxActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  boxInput: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },

  // ── Progress dots ─────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotFilled: { backgroundColor: COLORS.primary },
  progressDotEmpty: { backgroundColor: COLORS.border },

  // ── Verify button ─────────────────────────────────────────
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  verifyBtnDisabled: { opacity: 0.45 },
  verifyText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── Resend ────────────────────────────────────────────────
  resendRow: { alignItems: 'center', marginBottom: 16 },
  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNum: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  timerLabel: { fontSize: 14, color: COLORS.textSecondary },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  resendText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // ── Tip ───────────────────────────────────────────────────
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: { fontSize: 12, color: COLORS.textLight },
});

export default OTPScreen;
