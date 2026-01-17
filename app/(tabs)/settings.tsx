import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities } from '@/hooks/use-activities';
import { Activity } from '@/types/activity';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ActivityFormData {
  name: string;
  category: string;
  color: string;
}

const CATEGORIES = [
  'Work',
  'Home',
  'Personal',
  'Exercise',
  'Learning',
  'Social',
  'Other',
];

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Green
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
    activities,
    activeActivities,
    inactiveActivities,
    loading,
    createActivity,
    updateActivity,
    deleteActivity,
    deactivateActivity,
    reactivateActivity,
    createDefaultActivities,
  } = useActivities();

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    category: CATEGORIES[0],
    color: COLORS[0],
  });

  const handleCreateActivity = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    try {
      await createActivity({
        name: formData.name.trim(),
        category: formData.category,
        color: formData.color,
        active: true,
      });
      setShowForm(false);
      setFormData({ name: '', category: CATEGORIES[0], color: COLORS[0] });
    } catch (error) {
      Alert.alert('Error', 'Failed to create activity');
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity || !formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    try {
      await updateActivity(editingActivity.id, {
        name: formData.name.trim(),
        category: formData.category,
        color: formData.color,
      });
      setShowForm(false);
      setEditingActivity(null);
      setFormData({ name: '', category: CATEGORIES[0], color: COLORS[0] });
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity');
    }
  };

  const handleDeleteActivity = (activity: Activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"? This will also delete all associated logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteActivity(activity.id),
        },
      ]
    );
  };

  const handleToggleActive = async (activity: Activity) => {
    try {
      if (activity.active) {
        await deactivateActivity(activity.id);
      } else {
        await reactivateActivity(activity.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity status');
    }
  };

  const openEditForm = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      category: activity.category || CATEGORIES[0],
      color: activity.color || COLORS[0],
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingActivity(null);
    setFormData({ name: '', category: CATEGORIES[0], color: COLORS[0] });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingActivity(null);
    setFormData({ name: '', category: CATEGORIES[0], color: COLORS[0] });
  };

  const handleCreateDefaults = () => {
    Alert.alert(
      'Create Default Activities',
      'This will create 8 sample activities to help you get started. You can edit or delete them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createDefaultActivities();
              Alert.alert('Success', 'Default activities created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create default activities');
            }
          },
        },
      ]
    );
  };

  const renderActivity = (activity: Activity) => (
    <View
      key={activity.id}
      style={[
        styles.activityItem,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <View style={styles.activityInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: activity.color }]} />
        <View style={styles.activityDetails}>
          <Text style={[styles.activityName, { color: colors.text }]}>
            {activity.name}
          </Text>
          <Text style={[styles.activityCategory, { color: colors.icon }]}>
            {activity.category}
          </Text>
        </View>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleActive(activity)}>
          <Text style={[styles.actionButtonText, { color: activity.active ? colors.tint : '#999' }]}>
            {activity.active ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditForm(activity)}>
          <IconSymbol name="pencil" size={20} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteActivity(activity)}>
          <IconSymbol name="trash" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activities</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={openCreateForm}>
              <IconSymbol name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
          ) : (
            <>
              {activeActivities.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>
                    Active Activities
                  </Text>
                  {activeActivities.map(renderActivity)}
                </>
              )}

              {inactiveActivities.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon, marginTop: 20 }]}>
                    Inactive Activities
                  </Text>
                  {inactiveActivities.map(renderActivity)}
                </>
              )}

              {activities.length === 0 && (
                <View>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No activities yet. Tap + to create one.
                  </Text>
                  <TouchableOpacity
                    style={[styles.defaultButton, { backgroundColor: colors.tint }]}
                    onPress={handleCreateDefaults}>
                    <Text style={styles.defaultButtonText}>Create Default Activities</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeForm}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </Text>
            <TouchableOpacity
              onPress={editingActivity ? handleUpdateActivity : handleCreateActivity}>
              <Text style={[styles.saveButton, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter activity name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          formData.category === category ? colors.tint : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, category })}>
                    <Text
                      style={[
                        styles.categoryButtonText,
                        {
                          color: formData.category === category ? '#fff' : colors.text,
                        },
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor: color,
                        borderWidth: formData.color === color ? 3 : 0,
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityCategory: {
    fontSize: 14,
    marginTop: 2,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
  },
  defaultButton: {
    marginHorizontal: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  defaultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
