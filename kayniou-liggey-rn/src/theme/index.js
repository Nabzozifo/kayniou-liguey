// ============================================================
// Göllè — Design System
// Light theme · 8pt grid · Inter/system sans-serif
// ============================================================

// ─── Palette ────────────────────────────────────────────────
export const PALETTE = {
  // Brand
  green900: '#064E45',
  green800: '#0A5C51',
  green700: '#0F7B6C',   // primary
  green600: '#12907F',
  green500: '#19B09C',
  green100: '#CEEEE9',
  green50:  '#E8F5F3',

  yellow500: '#F2C94C',  // secondary
  yellow400: '#F5D575',
  yellow300: '#F8E4A0',
  yellow100: '#FEF9E7',

  // Neutral
  gray900: '#111827',
  gray800: '#1F2937',   // text
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',   // textSecondary
  gray400: '#9CA3AF',   // textLight
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',   // border
  gray100: '#F3F4F6',
  gray50:  '#F9FAFB',   // background

  // Semantic
  white:   '#FFFFFF',
  black:   '#000000',
  red500:  '#EF4444',
  green500semantic: '#10B981',
  orange500: '#F59E0B',
  blue500: '#3B82F6',
};

// ─── Colors (semantic aliases) ──────────────────────────────
export const COLORS = {
  // Brand
  primary:      PALETTE.green700,
  primaryDark:  PALETTE.green800,
  primaryLight: PALETTE.green50,

  secondary:      PALETTE.yellow500,
  secondaryDark:  '#D4A82A',
  secondaryLight: PALETTE.yellow100,

  accent:      PALETTE.green600,
  accentLight: PALETTE.green100,

  // Status
  success: PALETTE.green500semantic,
  error:   PALETTE.red500,
  warning: PALETTE.yellow500,
  info:    PALETTE.blue500,

  // Surfaces
  background:     PALETTE.gray50,
  backgroundDark: PALETTE.gray100,
  surface:        PALETTE.white,
  surfaceHover:   PALETTE.gray50,

  // Text
  text:          PALETTE.gray800,
  textSecondary: PALETTE.gray500,
  textLight:     PALETTE.gray400,

  // Borders
  border:      PALETTE.gray200,
  borderLight: PALETTE.gray100,
  divider:     PALETTE.gray200,

  // Shadows (used as shadowColor)
  shadow:     '#00000012',
  shadowDark: '#00000028',

  // Basic
  white: PALETTE.white,
  black: PALETTE.black,
  dark:  PALETTE.gray800,

  // Legacy gray map (backwards-compat with existing screens)
  gray: {
    50:  PALETTE.gray50,
    100: PALETTE.gray100,
    200: PALETTE.gray200,
    300: PALETTE.gray300,
    400: PALETTE.gray400,
    500: PALETTE.gray500,
    600: PALETTE.gray600,
    700: PALETTE.gray700,
    800: PALETTE.gray800,
    900: PALETTE.gray900,
  },

  lightGray:  PALETTE.gray100,
  mediumGray: PALETTE.gray300,
  darkGray:   PALETTE.gray600,
};

// ─── Typography ─────────────────────────────────────────────
export const TYPOGRAPHY = {
  // Display
  display: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  // Headings
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36, color: COLORS.text },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, color: COLORS.text },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, color: COLORS.text },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 26, color: COLORS.text },
  // Body
  bodyLg: { fontSize: 17, fontWeight: '400', lineHeight: 26, color: COLORS.text },
  body:   { fontSize: 15, fontWeight: '400', lineHeight: 23, color: COLORS.text },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 20, color: COLORS.textSecondary },
  // Labels / captions
  label:   { fontSize: 13, fontWeight: '600', lineHeight: 18, color: COLORS.textSecondary },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 17, color: COLORS.textLight },
  overline:{ fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 0.8, color: COLORS.textLight },
};

// ─── Spacing (8pt grid) ──────────────────────────────────────
export const SPACING = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
};

// ─── Border radius ───────────────────────────────────────────
export const RADIUS = {
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

// ─── Shadows ─────────────────────────────────────────────────
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: PALETTE.green700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ─── Common component styles ─────────────────────────────────
export const CARD = {
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  elevated: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
};

export const BUTTON = {
  primary: {
    container: {
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...SHADOWS.primary,
    },
    text: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
    text: {
      color: COLORS.primary,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    text: {
      color: COLORS.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  },
  danger: {
    container: {
      backgroundColor: COLORS.error,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    text: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '600',
    },
  },
};

// ─── Navigation theme ────────────────────────────────────────
export const NAV_THEME = {
  headerStyle: {
    backgroundColor: COLORS.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTintColor: '#FFFFFF',
  tabBarStyle: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    ...SHADOWS.md,
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.gray400,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
};

// Default export for convenience
const theme = {
  COLORS,
  PALETTE,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  CARD,
  BUTTON,
  NAV_THEME,
};

export default theme;
