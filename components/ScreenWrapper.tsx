import React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

type ScreenWrapperProps = ViewProps & {
  children: React.ReactNode;
};

export function ScreenWrapper({ children, style, ...props }: ScreenWrapperProps) {
  return (
    <SafeAreaView edges={['top']} style={[styles.wrapper, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
});
