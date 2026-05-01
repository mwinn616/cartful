import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';

type CardProps = ViewProps & {
  children: React.ReactNode;
};

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.md,
  },
});
