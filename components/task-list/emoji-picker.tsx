import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DEFAULT_EMOJIS } from '@/types/task-list';

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiPicker({ selectedEmoji, onSelectEmoji }: EmojiPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.emojiScroll}
      contentContainerStyle={styles.emojiScrollContent}>
      {DEFAULT_EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={[
            styles.emojiOption,
            selectedEmoji === emoji && styles.emojiOptionSelected,
          ]}
          onPress={() => onSelectEmoji(emoji)}
          activeOpacity={0.7}>
          <ThemedText style={styles.emojiOptionText}>{emoji}</ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emojiScroll: {
    marginBottom: 12,
  },
  emojiScrollContent: {
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#0a7ea4',
  },
  emojiOptionText: {
    fontSize: 24,
  },
});
