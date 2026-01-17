import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskList } from '@/types/task-list';

interface TaskListDropdownProps {
  taskLists: TaskList[];
  selectedTaskList: TaskList | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (list: TaskList) => void;
  iconColor: string;
  tintColor: string;
}

export function TaskListDropdown({
  taskLists,
  selectedTaskList,
  isOpen,
  onToggle,
  onSelect,
  iconColor,
  tintColor,
}: TaskListDropdownProps) {
  const colorScheme = useColorScheme() ?? 'light';

  if (!selectedTaskList) return null;

  return (
    <ThemedView style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.dropdown,
          { backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2d2e' },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}>
        <View style={styles.dropdownLeft}>
          <View style={[styles.dropdownEmoji, { backgroundColor: selectedTaskList.color }]}>
            <ThemedText style={styles.dropdownEmojiText}>{selectedTaskList.emoji}</ThemedText>
          </View>
          <ThemedText style={styles.dropdownText}>{selectedTaskList.name}</ThemedText>
        </View>
        <IconSymbol
          name="chevron.right"
          size={20}
          color={iconColor}
          style={{
            transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>

      {isOpen && (
        <ThemedView
          style={[
            styles.dropdownMenu,
            { backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2d2e' },
          ]}>
          <ScrollView style={styles.dropdownScroll}>
            {taskLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.dropdownItem,
                  selectedTaskList.id === list.id && styles.dropdownItemSelected,
                ]}
                onPress={() => onSelect(list)}
                activeOpacity={0.7}>
                <View style={styles.dropdownLeft}>
                  <View style={[styles.dropdownEmoji, { backgroundColor: list.color }]}>
                    <ThemedText style={styles.dropdownEmojiText}>{list.emoji}</ThemedText>
                  </View>
                  <ThemedText style={styles.dropdownText}>{list.name}</ThemedText>
                </View>
                {selectedTaskList.id === list.id && (
                  <IconSymbol name="checkmark" size={20} color={tintColor} weight="bold" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownEmoji: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dropdownEmojiText: {
    fontSize: 18,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  dropdownItemSelected: {
    opacity: 1,
  },
});
