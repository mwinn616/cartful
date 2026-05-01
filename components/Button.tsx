import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

type ButtonProps = TouchableOpacityProps & {
  label: string;
  variant?: 'primary' | 'ghost';
};

export function Button({ label, variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, variant === 'primary' ? styles.primary : styles.ghost, style]}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.button,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.background,
  },
  ghostLabel: {
    color: Colors.accent,
  },
});
