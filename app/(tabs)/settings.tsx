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
import { useActivityTypes } from '@/hooks/use-activities';
import { useBehaviors } from '@/hooks/use-behaviors';
import { useReflectionQuestions } from '@/hooks/use-reflections';
import { ActivityType } from '@/types/activity';
import { Behavior, BehaviorType } from '@/types/behavior';
import { ReflectionQuestion } from '@/types/reflection';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ActivityTypeFormData {
  name: string;
  color: string;
}

interface BehaviorFormData {
  name: string;
  type: BehaviorType;
  units: string;
}

interface ReflectionQuestionFormData {
  text: string;
}

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

const BEHAVIOR_TYPES: { value: BehaviorType; label: string; description: string }[] = [
  { value: 'reps', label: 'Reps', description: 'Count repetitions (pushups, situps)' },
  { value: 'duration', label: 'Duration', description: 'Track time (meditation, running)' },
  { value: 'weight', label: 'Weight', description: 'Track weight/resistance (curls, bench press)' },
  { value: 'count', label: 'Count', description: 'Simple counting (glasses of water)' },
];

const UNITS_BY_TYPE: Record<BehaviorType, string[]> = {
  reps: ['reps', 'sets'],
  duration: ['minutes', 'hours', 'seconds'],
  weight: ['lbs', 'kg'],
  count: ['glasses', 'servings', 'times'],
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Use background color for text/icons on tint-colored backgrounds (for contrast)
  const tintContrastColor = colors.background;

  const {
    activityTypes,
    activeActivityTypes,
    inactiveActivityTypes,
    loading: activityTypesLoading,
    createActivityType,
    updateActivityType,
    deleteActivityType,
    deactivateActivityType,
    reactivateActivityType,
    createDefaultActivityTypes,
  } = useActivityTypes();

  const {
    behaviors,
    activeBehaviors,
    inactiveBehaviors,
    loading: behaviorsLoading,
    createBehavior,
    updateBehavior,
    deleteBehavior,
    deactivateBehavior,
    reactivateBehavior,
    createDefaultBehaviors,
  } = useBehaviors();

  const {
    questions,
    activeQuestions,
    inactiveQuestions,
    loading: questionsLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deactivateQuestion,
    reactivateQuestion,
    createDefaultQuestions,
  } = useReflectionQuestions();

  const [showActivityTypeForm, setShowActivityTypeForm] = useState(false);
  const [editingActivityType, setEditingActivityType] = useState<ActivityType | null>(null);
  const [activityTypeFormData, setActivityTypeFormData] = useState<ActivityTypeFormData>({
    name: '',
    color: COLORS[0],
  });

  const [showBehaviorForm, setShowBehaviorForm] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<Behavior | null>(null);
  const [behaviorFormData, setBehaviorFormData] = useState<BehaviorFormData>({
    name: '',
    type: 'reps',
    units: 'reps',
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ReflectionQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState<ReflectionQuestionFormData>({
    text: '',
  });

  const handleCreateActivityType = async () => {
    if (!activityTypeFormData.name.trim()) {
      Alert.alert('Error', 'Activity type name is required');
      return;
    }

    try {
      await createActivityType({
        name: activityTypeFormData.name.trim(),
        color: activityTypeFormData.color,
      });
      setShowActivityTypeForm(false);
      setActivityTypeFormData({ name: '', color: COLORS[0] });
    } catch (error) {
      Alert.alert('Error', 'Failed to create activity type');
    }
  };

  const handleUpdateActivityType = async () => {
    if (!editingActivityType || !activityTypeFormData.name.trim()) {
      Alert.alert('Error', 'Activity type name is required');
      return;
    }

    try {
      await updateActivityType(editingActivityType.id, {
        name: activityTypeFormData.name.trim(),
        color: activityTypeFormData.color,
      });
      setShowActivityTypeForm(false);
      setEditingActivityType(null);
      setActivityTypeFormData({ name: '', color: COLORS[0] });
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity type');
    }
  };

  const handleDeleteActivityType = (activityType: ActivityType) => {
    Alert.alert(
      'Delete Activity Type',
      `Are you sure you want to delete "${activityType.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteActivityType(activityType.id),
        },
      ]
    );
  };

  const handleToggleActivityTypeActive = async (activityType: ActivityType) => {
    try {
      if (activityType.active) {
        await deactivateActivityType(activityType.id);
      } else {
        await reactivateActivityType(activityType.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity type status');
    }
  };

  const openEditActivityTypeForm = (activityType: ActivityType) => {
    setEditingActivityType(activityType);
    setActivityTypeFormData({
      name: activityType.name,
      color: activityType.color,
    });
    setShowActivityTypeForm(true);
  };

  const openCreateActivityTypeForm = () => {
    setEditingActivityType(null);
    setActivityTypeFormData({ name: '', color: COLORS[0] });
    setShowActivityTypeForm(true);
  };

  const closeActivityTypeForm = () => {
    setShowActivityTypeForm(false);
    setEditingActivityType(null);
    setActivityTypeFormData({ name: '', color: COLORS[0] });
  };

  const handleCreateDefaultActivityTypes = () => {
    Alert.alert(
      'Create Default Activity Types',
      'This will create 6 sample activity types to help you get started. You can edit or delete them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createDefaultActivityTypes();
              Alert.alert('Success', 'Default activity types created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create default activity types');
            }
          },
        },
      ]
    );
  };

  // Behavior handlers
  const handleCreateBehavior = async () => {
    if (!behaviorFormData.name.trim()) {
      Alert.alert('Error', 'Behavior name is required');
      return;
    }

    try {
      await createBehavior({
        name: behaviorFormData.name.trim(),
        type: behaviorFormData.type,
        units: behaviorFormData.units,
        active: true,
      });
      setShowBehaviorForm(false);
      setBehaviorFormData({ name: '', type: 'reps', units: 'reps' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create behavior');
    }
  };

  const handleUpdateBehavior = async () => {
    if (!editingBehavior || !behaviorFormData.name.trim()) {
      Alert.alert('Error', 'Behavior name is required');
      return;
    }

    try {
      await updateBehavior(editingBehavior.id, {
        name: behaviorFormData.name.trim(),
        type: behaviorFormData.type,
        units: behaviorFormData.units,
      });
      setShowBehaviorForm(false);
      setEditingBehavior(null);
      setBehaviorFormData({ name: '', type: 'reps', units: 'reps' });
    } catch (error) {
      Alert.alert('Error', 'Failed to update behavior');
    }
  };

  const handleDeleteBehavior = (behavior: Behavior) => {
    Alert.alert(
      'Delete Behavior',
      `Are you sure you want to delete "${behavior.name}"? This will also delete all associated logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBehavior(behavior.id),
        },
      ]
    );
  };

  const handleToggleBehaviorActive = async (behavior: Behavior) => {
    try {
      if (behavior.active) {
        await deactivateBehavior(behavior.id);
      } else {
        await reactivateBehavior(behavior.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update behavior status');
    }
  };

  const openEditBehaviorForm = (behavior: Behavior) => {
    setEditingBehavior(behavior);
    setBehaviorFormData({
      name: behavior.name,
      type: behavior.type,
      units: behavior.units,
    });
    setShowBehaviorForm(true);
  };

  const openCreateBehaviorForm = () => {
    setEditingBehavior(null);
    setBehaviorFormData({ name: '', type: 'reps', units: 'reps' });
    setShowBehaviorForm(true);
  };

  const closeBehaviorForm = () => {
    setShowBehaviorForm(false);
    setEditingBehavior(null);
    setBehaviorFormData({ name: '', type: 'reps', units: 'reps' });
  };

  const handleCreateDefaultBehaviors = () => {
    Alert.alert(
      'Create Default Behaviors',
      'This will create 8 sample behaviors to help you get started. You can edit or delete them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createDefaultBehaviors();
              Alert.alert('Success', 'Default behaviors created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create default behaviors');
            }
          },
        },
      ]
    );
  };

  const handleBehaviorTypeChange = (type: BehaviorType) => {
    const defaultUnits = UNITS_BY_TYPE[type][0];
    setBehaviorFormData({ ...behaviorFormData, type, units: defaultUnits });
  };

  // Reflection question handlers
  const handleCreateQuestion = async () => {
    if (!questionFormData.text.trim()) {
      Alert.alert('Error', 'Question text is required');
      return;
    }

    try {
      await createQuestion({
        text: questionFormData.text.trim(),
      });
      setShowQuestionForm(false);
      setQuestionFormData({ text: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create reflection question');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !questionFormData.text.trim()) {
      Alert.alert('Error', 'Question text is required');
      return;
    }

    try {
      await updateQuestion(editingQuestion.id, {
        text: questionFormData.text.trim(),
      });
      setShowQuestionForm(false);
      setEditingQuestion(null);
      setQuestionFormData({ text: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to update reflection question');
    }
  };

  const handleDeleteQuestion = (question: ReflectionQuestion) => {
    Alert.alert(
      'Delete Reflection Question',
      `Are you sure you want to delete this question? Historical responses will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteQuestion(question.id),
        },
      ]
    );
  };

  const handleToggleQuestionActive = async (question: ReflectionQuestion) => {
    try {
      if (question.active) {
        await deactivateQuestion(question.id);
      } else {
        await reactivateQuestion(question.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update question status');
    }
  };

  const openEditQuestionForm = (question: ReflectionQuestion) => {
    setEditingQuestion(question);
    setQuestionFormData({
      text: question.text,
    });
    setShowQuestionForm(true);
  };

  const openCreateQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionFormData({ text: '' });
    setShowQuestionForm(true);
  };

  const closeQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionFormData({ text: '' });
  };

  const handleCreateDefaultQuestions = () => {
    Alert.alert(
      'Create Default Questions',
      'This will create 6 sample reflection questions to help you get started. You can edit or delete them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await createDefaultQuestions();
              Alert.alert('Success', 'Default reflection questions created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create default questions');
            }
          },
        },
      ]
    );
  };

  const renderActivityType = (activityType: ActivityType) => (
    <View
      key={activityType.id}
      style={[
        styles.activityItem,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <View style={styles.activityInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: activityType.color }]} />
        <View style={styles.activityDetails}>
          <Text style={[styles.activityName, { color: colors.text }]}>
            {activityType.name}
          </Text>
        </View>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleActivityTypeActive(activityType)}>
          <Text style={[styles.actionButtonText, { color: activityType.active ? colors.tint : '#999' }]}>
            {activityType.active ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditActivityTypeForm(activityType)}>
          <IconSymbol name="pencil" size={20} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteActivityType(activityType)}>
          <IconSymbol name="trash" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBehavior = (behavior: Behavior) => {
    const typeLabel = BEHAVIOR_TYPES.find((t) => t.value === behavior.type)?.label || behavior.type;
    return (
      <View
        key={behavior.id}
        style={[
          styles.activityItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}>
        <View style={styles.activityInfo}>
          <View style={styles.activityDetails}>
            <Text style={[styles.activityName, { color: colors.text }]}>
              {behavior.name}
            </Text>
            <Text style={[styles.activityCategory, { color: colors.icon }]}>
              {typeLabel} • {behavior.units}
            </Text>
          </View>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleBehaviorActive(behavior)}>
            <Text style={[styles.actionButtonText, { color: behavior.active ? colors.tint : '#999' }]}>
              {behavior.active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditBehaviorForm(behavior)}>
            <IconSymbol name="pencil" size={20} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteBehavior(behavior)}>
            <IconSymbol name="trash" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReflectionQuestion = (question: ReflectionQuestion) => {
    return (
      <View
        key={question.id}
        style={[
          styles.activityItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}>
        <View style={styles.activityInfo}>
          <View style={styles.activityDetails}>
            <Text style={[styles.activityName, { color: colors.text }]}>
              {question.text}
            </Text>
          </View>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleQuestionActive(question)}>
            <Text style={[styles.actionButtonText, { color: question.active ? colors.tint : '#999' }]}>
              {question.active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditQuestionForm(question)}>
            <IconSymbol name="pencil" size={20} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteQuestion(question)}>
            <IconSymbol name="trash" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Types</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={openCreateActivityTypeForm}>
              <IconSymbol name="plus" size={20} color={tintContrastColor} />
            </TouchableOpacity>
          </View>

          {activityTypesLoading ? (
            <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
          ) : (
            <>
              {activeActivityTypes.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>
                    Active Activity Types
                  </Text>
                  {activeActivityTypes.map(renderActivityType)}
                </>
              )}

              {inactiveActivityTypes.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon, marginTop: 20 }]}>
                    Inactive Activity Types
                  </Text>
                  {inactiveActivityTypes.map(renderActivityType)}
                </>
              )}

              {activityTypes.length === 0 && (
                <View>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No activity types yet. Tap + to create one.
                  </Text>
                  <TouchableOpacity
                    style={[styles.defaultButton, { backgroundColor: colors.tint }]}
                    onPress={handleCreateDefaultActivityTypes}>
                    <Text style={[styles.defaultButtonText, { color: tintContrastColor }]}>Create Default Activity Types</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Behaviors</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={openCreateBehaviorForm}>
              <IconSymbol name="plus" size={20} color={tintContrastColor} />
            </TouchableOpacity>
          </View>

          {behaviorsLoading ? (
            <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
          ) : (
            <>
              {activeBehaviors.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>
                    Active Behaviors
                  </Text>
                  {activeBehaviors.map(renderBehavior)}
                </>
              )}

              {inactiveBehaviors.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon, marginTop: 20 }]}>
                    Inactive Behaviors
                  </Text>
                  {inactiveBehaviors.map(renderBehavior)}
                </>
              )}

              {behaviors.length === 0 && (
                <View>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No behaviors yet. Tap + to create one.
                  </Text>
                  <TouchableOpacity
                    style={[styles.defaultButton, { backgroundColor: colors.tint }]}
                    onPress={handleCreateDefaultBehaviors}>
                    <Text style={[styles.defaultButtonText, { color: tintContrastColor }]}>Create Default Behaviors</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reflection Questions</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={openCreateQuestionForm}>
              <IconSymbol name="plus" size={20} color={tintContrastColor} />
            </TouchableOpacity>
          </View>

          {questionsLoading ? (
            <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
          ) : (
            <>
              {activeQuestions.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon }]}>
                    Active Questions
                  </Text>
                  {activeQuestions.map(renderReflectionQuestion)}
                </>
              )}

              {inactiveQuestions.length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { color: colors.icon, marginTop: 20 }]}>
                    Inactive Questions
                  </Text>
                  {inactiveQuestions.map(renderReflectionQuestion)}
                </>
              )}

              {questions.length === 0 && (
                <View>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No reflection questions yet. Tap + to create one.
                  </Text>
                  <TouchableOpacity
                    style={[styles.defaultButton, { backgroundColor: colors.tint }]}
                    onPress={handleCreateDefaultQuestions}>
                    <Text style={[styles.defaultButtonText, { color: tintContrastColor }]}>Create Default Questions</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showActivityTypeForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeActivityTypeForm}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeActivityTypeForm}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingActivityType ? 'Edit Activity Type' : 'New Activity Type'}
            </Text>
            <TouchableOpacity
              onPress={editingActivityType ? handleUpdateActivityType : handleCreateActivityType}>
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
                value={activityTypeFormData.name}
                onChangeText={(text) => setActivityTypeFormData({ ...activityTypeFormData, name: text })}
                placeholder="Enter activity type name (e.g., Work, Exercise)"
                placeholderTextColor={colors.icon}
              />
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
                        borderWidth: activityTypeFormData.color === color ? 3 : 0,
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={() => setActivityTypeFormData({ ...activityTypeFormData, color })}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showBehaviorForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBehaviorForm}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeBehaviorForm}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingBehavior ? 'Edit Behavior' : 'New Behavior'}
            </Text>
            <TouchableOpacity
              onPress={editingBehavior ? handleUpdateBehavior : handleCreateBehavior}>
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
                value={behaviorFormData.name}
                onChangeText={(text) => setBehaviorFormData({ ...behaviorFormData, name: text })}
                placeholder="Enter behavior name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <View style={styles.categoryGrid}>
                {BEHAVIOR_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.behaviorTypeButton,
                      {
                        backgroundColor:
                          behaviorFormData.type === type.value ? colors.tint : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleBehaviorTypeChange(type.value)}>
                    <Text
                      style={[
                        styles.categoryButtonText,
                        {
                          color: behaviorFormData.type === type.value ? tintContrastColor : colors.text,
                        },
                      ]}>
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.behaviorTypeDescription,
                        {
                          color: behaviorFormData.type === type.value ? tintContrastColor : colors.icon,
                        },
                      ]}>
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Units</Text>
              <View style={styles.categoryGrid}>
                {UNITS_BY_TYPE[behaviorFormData.type].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          behaviorFormData.units === unit ? colors.tint : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setBehaviorFormData({ ...behaviorFormData, units: unit })}>
                    <Text
                      style={[
                        styles.categoryButtonText,
                        {
                          color: behaviorFormData.units === unit ? tintContrastColor : colors.text,
                        },
                      ]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showQuestionForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeQuestionForm}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeQuestionForm}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingQuestion ? 'Edit Question' : 'New Question'}
            </Text>
            <TouchableOpacity
              onPress={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}>
              <Text style={[styles.saveButton, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Question</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                value={questionFormData.text}
                onChangeText={(text) => setQuestionFormData({ text })}
                placeholder="Enter your reflection question (e.g., How productive was I today?)"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.helpText, { color: colors.icon }]}>
                This question will be used in your daily reflections. Responses are rated on a 0-10 scale.
              </Text>
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
  behaviorTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '48%',
  },
  behaviorTypeDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
