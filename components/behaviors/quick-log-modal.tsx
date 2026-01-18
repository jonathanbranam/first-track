/**
 * QuickLogModal - Fast behavior logging interface
 * Provides a non-intrusive modal for quickly logging behaviors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBehaviors, useBehaviorLogs } from '@/hooks/use-behaviors';
import { Behavior } from '@/types/behavior';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface QuickLogModalProps {
  visible: boolean;
  onClose: () => void;
}

interface LogFormData {
  behaviorId: string;
  quantity: string;
  weight: string;
}

// Store the last logged values for each behavior
const lastLoggedValues: Record<string, { quantity: number; weight?: number }> = {};

export function QuickLogModal({ visible, onClose }: QuickLogModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tintContrastColor = colors.background;

  const { activeBehaviors } = useBehaviors();
  const { createLog } = useBehaviorLogs();

  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);
  const [formData, setFormData] = useState<LogFormData>({
    behaviorId: '',
    quantity: '',
    weight: '',
  });
  const [showBehaviorPicker, setShowBehaviorPicker] = useState(false);

  // Auto-populate with previous settings when behavior is selected
  useEffect(() => {
    if (selectedBehavior) {
      const lastLog = lastLoggedValues[selectedBehavior.id];
      if (lastLog) {
        setFormData({
          behaviorId: selectedBehavior.id,
          quantity: lastLog.quantity.toString(),
          weight: lastLog.weight?.toString() || '',
        });
      } else {
        setFormData({
          behaviorId: selectedBehavior.id,
          quantity: '',
          weight: '',
        });
      }
    }
  }, [selectedBehavior]);

  // Select first behavior when modal opens if none selected
  useEffect(() => {
    if (visible && activeBehaviors.length > 0 && !selectedBehavior) {
      const firstBehavior = activeBehaviors[0];
      setSelectedBehavior(firstBehavior);
    }
  }, [visible, activeBehaviors, selectedBehavior]);

  const handleSelectBehavior = (behavior: Behavior) => {
    setSelectedBehavior(behavior);
    setShowBehaviorPicker(false);
  };

  const handleSave = async () => {
    if (!selectedBehavior || !formData.quantity) {
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return;
    }

    const weight = formData.weight ? parseFloat(formData.weight) : undefined;
    if (formData.weight && (isNaN(weight!) || weight! <= 0)) {
      return;
    }

    try {
      // Save the log
      await createLog({
        behaviorId: selectedBehavior.id,
        timestamp: Date.now(),
        quantity,
        weight,
      });

      // Store the last logged values for auto-populate
      lastLoggedValues[selectedBehavior.id] = { quantity, weight };

      // Auto-close after successful save
      handleClose();
    } catch (error) {
      console.error('Failed to create behavior log:', error);
    }
  };

  const handleClose = () => {
    setShowBehaviorPicker(false);
    onClose();
  };

  const needsWeight = selectedBehavior?.type === 'weight';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Quick Log</Text>
            <TouchableOpacity onPress={handleSave} disabled={!formData.quantity}>
              <Text
                style={[
                  styles.saveButton,
                  { color: formData.quantity ? colors.tint : colors.icon },
                ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {activeBehaviors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No active behaviors found. Create behaviors in Settings first.
                </Text>
              </View>
            ) : (
              <>
                {/* Behavior Selector */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Behavior</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowBehaviorPicker(true)}>
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                      {selectedBehavior ? selectedBehavior.name : 'Select a behavior'}
                    </Text>
                    <IconSymbol name="chevron.down" size={20} color={colors.icon} />
                  </TouchableOpacity>
                </View>

                {selectedBehavior && (
                  <>
                    {/* Quantity Input */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {selectedBehavior.type === 'reps'
                          ? 'Reps'
                          : selectedBehavior.type === 'duration'
                          ? 'Duration'
                          : selectedBehavior.type === 'weight'
                          ? 'Reps'
                          : 'Count'}{' '}
                        ({selectedBehavior.units})
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={formData.quantity}
                        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                        placeholder={`Enter ${selectedBehavior.units}`}
                        placeholderTextColor={colors.icon}
                        keyboardType="numeric"
                        autoFocus
                      />
                    </View>

                    {/* Weight Input (conditional) */}
                    {needsWeight && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>
                          Weight ({selectedBehavior.units})
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={formData.weight}
                          onChangeText={(text) => setFormData({ ...formData, weight: text })}
                          placeholder={`Enter weight in ${selectedBehavior.units}`}
                          placeholderTextColor={colors.icon}
                          keyboardType="numeric"
                        />
                      </View>
                    )}

                    {/* Quick Save Button */}
                    <TouchableOpacity
                      style={[
                        styles.quickSaveButton,
                        {
                          backgroundColor: formData.quantity ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={handleSave}
                      disabled={!formData.quantity}>
                      <Text
                        style={[
                          styles.quickSaveButtonText,
                          { color: formData.quantity ? tintContrastColor : colors.icon },
                        ]}>
                        Log {selectedBehavior.name}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Behavior Picker Modal */}
          <Modal
            visible={showBehaviorPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBehaviorPicker(false)}>
            <SafeAreaView style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Behavior</Text>
                <TouchableOpacity onPress={() => setShowBehaviorPicker(false)}>
                  <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {activeBehaviors.map((behavior) => (
                  <TouchableOpacity
                    key={behavior.id}
                    style={[
                      styles.behaviorItem,
                      {
                        backgroundColor:
                          selectedBehavior?.id === behavior.id
                            ? colors.tint + '20'
                            : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelectBehavior(behavior)}>
                    <View style={styles.behaviorInfo}>
                      <Text style={[styles.behaviorName, { color: colors.text }]}>
                        {behavior.name}
                      </Text>
                      <Text style={[styles.behaviorType, { color: colors.icon }]}>
                        {behavior.type} • {behavior.units}
                      </Text>
                    </View>
                    {selectedBehavior?.id === behavior.id && (
                      <IconSymbol name="checkmark" size={24} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
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
  content: {
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
    fontSize: 18,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  quickSaveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  quickSaveButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContent: {
    flex: 1,
    padding: 20,
  },
  behaviorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  behaviorInfo: {
    flex: 1,
  },
  behaviorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  behaviorType: {
    fontSize: 14,
    marginTop: 2,
  },
});
