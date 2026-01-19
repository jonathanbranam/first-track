import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskList } from '@/types/task-list';

interface TaskListItemProps {
  list: TaskList;
  onEdit: (list: TaskList) => void;
  onDelete: (id: string) => void;
  iconColor: string;
}

export function TaskListItem({ list, onEdit, onDelete, iconColor }: TaskListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View
      style={[
        styles.listItem,
        { backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2d2e' },
      ]}>
      <View style={styles.listItemLeft}>
        <View style={[styles.emojiContainer, { backgroundColor: list.color }]}>
          <ThemedText style={styles.emoji}>{list.emoji}</ThemedText>
        </View>
        <View style={styles.listNameContainer}>
          <ThemedText style={styles.listName}>{list.name}</ThemedText>
          {list.listType && list.listType !== 'permanent' && (
            <View style={[
              styles.badge,
              { backgroundColor: list.listType === 'someday' ? '#95a5a6' : '#3498db' }
            ]}>
              <ThemedText style={styles.badgeText}>
                {list.listType === 'someday' ? 'Someday' : 'Temporary'}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(list)}
          activeOpacity={0.7}>
          <IconSymbol name="pencil" size={20} color={iconColor} />
        </TouchableOpacity>
        {list.id !== 'default' && (
          <TouchableOpacity
            testID={`delete-list-${list.id}`}
            style={styles.actionButton}
            onPress={() => onDelete(list.id)}
            activeOpacity={0.7}>
            <IconSymbol name="trash" size={20} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  listNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
});
