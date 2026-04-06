import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

/**
 * Göllè — Button component
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
const Button = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const containerStyle = [
    styles.base,
    styles[`container_${variant}`],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? COLORS.white : COLORS.primary}
          size="small"
        />
      ) : (
        <>
          {icon && icon}
          <Text style={labelStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: RADIUS.md,
  },

  // ── Variants ──────────────────────────────────────────────
  container_primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  container_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  container_danger: {
    backgroundColor: COLORS.error,
  },

  // ── Sizes ────────────────────────────────────────────────
  size_sm: {
    paddingVertical: SPACING.xxs + 2,
    paddingHorizontal: SPACING.sm,
  },
  size_md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },

  // ── Labels ───────────────────────────────────────────────
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label_primary: { color: COLORS.white },
  label_secondary: { color: COLORS.primary },
  label_ghost: { color: COLORS.primary },
  label_danger: { color: COLORS.white },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },

  // ── Disabled ─────────────────────────────────────────────
  disabled: {
    opacity: 0.55,
  },
});

export default Button;
