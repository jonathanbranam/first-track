import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task } from '@/types/task';

interface TaskItemProps extends Omit<RenderItemParams<Task>, 'getIndex'> {
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  swipeableRef?: (ref: Swipeable | null, id: string) => void;
}

export function TaskItem({ item, drag, isActive, onToggle, onDelete, swipeableRef }: TaskItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const renderRightActions = () => (
    <TouchableOpacity
      testID={`delete-action-${item.id}`}
      style={styles.deleteAction}
      onPress={() => onDelete(item.id)}>
      <IconSymbol name="trash" size={24} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <ScaleDecorator activeScale={1.03}>
      <Swipeable
        ref={(ref) => swipeableRef?.(ref, item.id)}
        renderRightActions={renderRightActions}
        overshootRight={false}
        enabled={!isActive}>
        <View
          style={[
            styles.taskItem,
            { backgroundColor: colors.background },
            isActive && styles.taskItemActive,
          ]}>
          <TouchableOpacity
            style={styles.taskContent}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.7}
            disabled={isActive}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: colors.icon,
                  backgroundColor: item.completed ? colors.tint : 'transparent',
                },
              ]}>
              {item.completed && (
                <IconSymbol
                  name="checkmark"
                  size={14}
                  color={colorScheme === 'light' ? '#fff' : Colors.dark.background}
                  weight="bold"
                />
              )}
            </View>
            <ThemedText
              style={[
                styles.taskText,
                item.completed && {
                  opacity: 0.5,
                  textDecorationLine: 'line-through',
                },
              ]}>
              {item.description}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`drag-handle-${item.id}`}
            style={styles.dragHandle}
            onPressIn={drag}
            disabled={isActive}>
            <IconSymbol name="line.3.horizontal" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </Swipeable>
    </ScaleDecorator>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  taskItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
});
