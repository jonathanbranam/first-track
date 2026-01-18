/**
 * QuickLogFAB - Floating Action Button for quick behavior logging
 * Provides a persistent button accessible from any screen
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useQuickLog } from '@/contexts/quick-log-context';

export function QuickLogFAB() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tintContrastColor = colors.background;
  const { showQuickLog } = useQuickLog();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.tint }]}
      onPress={showQuickLog}
      activeOpacity={0.8}>
      <IconSymbol name="plus.circle.fill" size={28} color={tintContrastColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 90 : 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
