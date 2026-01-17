import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface EmptyStateProps {
  iconColor: string;
}

export function EmptyState({ iconColor }: EmptyStateProps) {
  return (
    <ThemedView style={styles.emptyState}>
      <IconSymbol name="checklist" size={64} color={iconColor} style={{ marginBottom: 16 }} />
      <ThemedText style={{ opacity: 0.6, textAlign: 'center' }}>
        No tasks yet.{'\n'}Tap the + button to add one.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
