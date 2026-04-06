import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';

// Each letter of "Göllè" animates independently with a stagger
const LETTERS = [
  { char: 'G',  accent: false },
  { char: 'ö',  accent: true  },
  { char: 'l',  accent: false },
  { char: 'l',  accent: false },
  { char: 'è',  accent: false },
];

const STAGGER      = 90;   // ms between each letter start
const LETTER_IN    = 480;  // ms each letter takes to appear
const ACCENT_DELAY = 520;  // ms after logo finishes → bar grows
const ACCENT_IN    = 380;
const TAGLINE_DELAY = 820;
const TAGLINE_IN    = 450;
const HOLD          = 900; // pause before handing off → total ≈ 3 s

const SplashScreen = ({ onFinish }) => {
  // Per-letter animated values
  const letterOpacities = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const letterTranslateY = useRef(LETTERS.map(() => new Animated.Value(18))).current;

  // "ö" accent bar
  const accentWidth   = useRef(new Animated.Value(0)).current;
  const accentOpacity = useRef(new Animated.Value(0)).current;

  // Tagline + wordmark
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // 1 — Letters appear one by one (staggered)
    const letterAnims = LETTERS.map((_, i) =>
      Animated.parallel([
        Animated.timing(letterOpacities[i], {
          toValue: 1,
          duration: LETTER_IN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(letterTranslateY[i], {
          toValue: 0,
          duration: LETTER_IN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(STAGGER, letterAnims).start();

    // 2 — "ö" accent bar
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(accentOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(accentWidth, {
          toValue: 30,
          duration: ACCENT_IN,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }),
      ]).start();
    }, ACCENT_DELAY);

    // 3 — Tagline slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: TAGLINE_IN,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: TAGLINE_IN,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, TAGLINE_DELAY);

    // 4 — Hand off after ~3 s
    const lastLetterEnd = (LETTERS.length - 1) * STAGGER + LETTER_IN;
    const total = Math.max(
      lastLetterEnd,
      ACCENT_DELAY + ACCENT_IN,
      TAGLINE_DELAY + TAGLINE_IN
    ) + HOLD;

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, total);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F7B6C" />

      {/* ── Logo: individual animated letters ───────────────── */}
      <View style={styles.logoBlock}>
        <View style={styles.brandRow}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandChar,
                letter.accent && styles.brandCharAccent,
                {
                  opacity: letterOpacities[i],
                  transform: [{ translateY: letterTranslateY[i] }],
                },
              ]}
              allowFontScaling={false}
            >
              {letter.char}
            </Animated.Text>
          ))}
        </View>

        {/* Accent bar under "ö" — positioned to align with the ö */}
        <View style={styles.accentBarTrack}>
          {/* spacer: G ≈ 1 char wide, then bar sits under ö */}
          <View style={styles.accentBarSpacer} />
          <Animated.View
            style={[
              styles.accentBar,
              { width: accentWidth, opacity: accentOpacity },
            ]}
          />
        </View>
      </View>

      {/* ── Tagline ──────────────────────────────────────────── */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
        allowFontScaling={false}
      >
        Trouve un travailleur. Trouve du travail.
      </Animated.Text>

      {/* ── Bottom wordmark ──────────────────────────────────── */}
      <Animated.Text
        style={[styles.wordmark, { opacity: taglineOpacity }]}
        allowFontScaling={false}
      >
        göllè.app
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F7B6C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoBlock: {
    alignItems: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  brandChar: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 82,
  },

  brandCharAccent: {
    color: '#F2C94C',
  },

  // Accent bar: sits under "ö" (second char)
  accentBarTrack: {
    flexDirection: 'row',
    marginTop: 4,
    height: 4,
    width: '100%',
    // We center it under the ö visually by using paddingLeft
    paddingLeft: 44, // approximately the width of "G" at font-size 72
  },
  accentBarSpacer: {
    // No spacer needed — paddingLeft handles it
  },
  accentBar: {
    height: 4,
    borderRadius: 99,
    backgroundColor: '#F2C94C',
  },

  tagline: {
    marginTop: 32,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },

  wordmark: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
  },
});

export default SplashScreen;
