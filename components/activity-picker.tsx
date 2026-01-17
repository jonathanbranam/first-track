/**
 * Activity picker modal component
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Activity } from '@/types/activity';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ActivityPickerProps {
  visible: boolean;
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onClose: () => void;
}

/**
 * Modal for selecting an activity to start timing
 */
export function ActivityPicker({ visible, activities, onSelectActivity, onClose }: ActivityPickerProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor }]} onPress={(e) => e.stopPropagation()}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.headerText}>Select Activity</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={[styles.closeButtonText, { color: tintColor }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.activityList}>
            {activities.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  No active activities. Create one in Settings.
                </ThemedText>
              </ThemedView>
            ) : (
              activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.activityItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    onSelectActivity(activity);
                    onClose();
                  }}
                >
                  <View style={styles.activityContent}>
                    {activity.color && (
                      <View style={[styles.colorIndicator, { backgroundColor: activity.color }]} />
                    )}
                    <View style={styles.activityInfo}>
                      <ThemedText style={styles.activityName}>{activity.name}</ThemedText>
                      {activity.category && (
                        <ThemedText style={styles.activityCategory}>{activity.category}</ThemedText>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityList: {
    flex: 1,
  },
  activityItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '500',
  },
  activityCategory: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});
