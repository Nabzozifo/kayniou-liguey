import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

/**
 * Göllè — Card component
 *
 * variant: 'flat' | 'elevated' | 'outlined'
 */
const Card = ({ children, variant = 'elevated', style, padding }) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  flat: {
    // no shadow
  },
  elevated: {
    ...SHADOWS.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default Card;
