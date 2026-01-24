import { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RatingScale } from '@/components/ui/rating-scale';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReflectionQuestions, useReflectionResponses } from '@/hooks/use-reflections';
import { ReflectionResponse } from '@/types/reflection';

export default function ReflectionHistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { questions, loading: questionsLoading } = useReflectionQuestions();
  const { responses, loading: responsesLoading, updateResponse, createResponse, deleteResponse } = useReflectionResponses();

  // TODO: Implement date selection for filtering responses
  // const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [editingResponse, setEditingResponse] = useState<ReflectionResponse | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState<number>(0);
  const [addResponses, setAddResponses] = useState<Map<string, number>>(new Map());

  // Group responses by date
  const responsesByDate = useCallback(() => {
    const grouped = new Map<number, ReflectionResponse[]>();
    responses.forEach((response) => {
      const existing = grouped.get(response.date) || [];
      grouped.set(response.date, [...existing, response]);
    });

    // Sort dates in descending order (most recent first)
    return new Map(
      Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])
    );
  }, [responses]);

  const groupedResponses = responsesByDate();

  // Get question text by ID
  const getQuestionText = useCallback((questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    return question?.text || 'Unknown Question';
  }, [questions]);

  // Format date for display
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }, []);

  // Handle edit response
  const handleEditResponse = useCallback((response: ReflectionResponse) => {
    setEditingResponse(response);
    setEditScore(response.score);
  }, []);

  // Save edited response
  const handleSaveEdit = useCallback(async () => {
    if (!editingResponse) return;

    try {
      await updateResponse(editingResponse.id, { score: editScore });
      setEditingResponse(null);
      Alert.alert('Success', 'Response updated successfully');
    } catch (error) {
      console.error('Error updating response:', error);
      Alert.alert('Error', 'Failed to update response. Please try again.');
    }
  }, [editingResponse, editScore, updateResponse]);

  // Handle delete response
  const handleDeleteResponse = useCallback(async (response: ReflectionResponse) => {
    Alert.alert(
      'Delete Response',
      'Are you sure you want to delete this response?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteResponse(response.id);
              Alert.alert('Success', 'Response deleted successfully');
            } catch (error) {
              console.error('Error deleting response:', error);
              Alert.alert('Error', 'Failed to delete response. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteResponse]);

  // Open add responses modal for a specific date
  const handleAddForDate = useCallback((date: number) => {
    setAddDate(date);
    setAddResponses(new Map());
    setShowAddModal(true);
  }, []);

  // Get questions that haven't been answered for a specific date
  const getUnansweredQuestions = useCallback((date: number) => {
    const dateResponses = groupedResponses.get(date) || [];
    const answeredQuestionIds = new Set(dateResponses.map((r) => r.questionId));
    return questions.filter((q) => !answeredQuestionIds.has(q.id));
  }, [questions, groupedResponses]);

  // Handle save add responses
  const handleSaveAddResponses = useCallback(async () => {
    const unansweredQuestions = getUnansweredQuestions(addDate);

    if (addResponses.size !== unansweredQuestions.length) {
      Alert.alert(
        'Incomplete Responses',
        `Please answer all ${unansweredQuestions.length} questions.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Promise.all(
        Array.from(addResponses.entries()).map(([questionId, score]) =>
          createResponse({
            questionId,
            date: addDate,
            score,
          })
        )
      );

      setShowAddModal(false);
      setAddResponses(new Map());
      Alert.alert('Success', 'Responses added successfully');
    } catch (error) {
      console.error('Error adding responses:', error);
      Alert.alert('Error', 'Failed to add responses. Please try again.');
    }
  }, [addDate, addResponses, createResponse, getUnansweredQuestions]);

  if (questionsLoading || responsesLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Reflection History
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (groupedResponses.size === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Reflection History
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol
            name="calendar"
            size={64}
            color={colors.icon}
            style={styles.emptyIcon}
          />
          <ThemedText style={styles.emptyTitle}>No Reflection History</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Complete your first daily reflection to see it here.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Reflection History
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Array.from(groupedResponses.entries()).map(([date, dateResponses]) => {
          const unansweredQuestions = getUnansweredQuestions(date);
          const hasUnanswered = unansweredQuestions.length > 0;

          return (
            <ThemedView
              key={date}
              style={[
                styles.dateCard,
                {
                  backgroundColor: colorScheme === 'light' ? '#f5f5f5' : '#2a2a2a',
                },
              ]}
            >
              <View style={styles.dateHeader}>
                <ThemedText style={styles.dateTitle}>
                  {formatDate(date)}
                </ThemedText>
                {hasUnanswered && (
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleAddForDate(date)}
                  >
                    <IconSymbol name="plus" size={16} color="#fff" />
                    <ThemedText style={[styles.addButtonText, { color: '#fff' }]}>
                      Add Missing
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {dateResponses.map((response) => (
                <View
                  key={response.id}
                  style={[
                    styles.responseItem,
                    {
                      backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
                    },
                  ]}
                >
                  <View style={styles.responseContent}>
                    <ThemedText style={styles.questionText}>
                      {getQuestionText(response.questionId)}
                    </ThemedText>
                    <View style={styles.scoreContainer}>
                      <View
                        style={[
                          styles.scoreBadge,
                          {
                            backgroundColor:
                              response.score >= 7
                                ? 'rgba(52, 199, 89, 0.2)'
                                : response.score >= 4
                                ? 'rgba(255, 159, 10, 0.2)'
                                : 'rgba(255, 59, 48, 0.2)',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.scoreText,
                            {
                              color:
                                response.score >= 7
                                  ? '#34C759'
                                  : response.score >= 4
                                  ? '#FF9F0A'
                                  : '#FF3B30',
                            },
                          ]}
                        >
                          {response.score}/10
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.responseActions}>
                    <TouchableOpacity
                      onPress={() => handleEditResponse(response)}
                      style={styles.actionButton}
                    >
                      <IconSymbol name="pencil" size={20} color={colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteResponse(response)}
                      style={styles.actionButton}
                    >
                      <IconSymbol name="trash" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {hasUnanswered && (
                <ThemedView style={styles.missingContainer}>
                  <IconSymbol name="exclamationmark.circle" size={16} color={colors.icon} />
                  <ThemedText style={styles.missingText}>
                    {unansweredQuestions.length} question{unansweredQuestions.length !== 1 ? 's' : ''} not answered
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          );
        })}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Response Modal */}
      <Modal
        visible={editingResponse !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingResponse(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Response</ThemedText>
              <TouchableOpacity
                onPress={() => setEditingResponse(null)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {editingResponse && (
              <>
                <ThemedText style={styles.editQuestionText}>
                  {getQuestionText(editingResponse.questionId)}
                </ThemedText>
                <View style={styles.editRatingContainer}>
                  <RatingScale
                    value={editScore}
                    onValueChange={setEditScore}
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditingResponse(null)}
                  >
                    <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      { backgroundColor: colors.tint },
                    ]}
                    onPress={handleSaveEdit}
                  >
                    <ThemedText
                      style={[
                        styles.modalButtonText,
                        { color: colorScheme === 'light' ? '#fff' : Colors.dark.background },
                      ]}
                    >
                      Save
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>

      {/* Add Responses Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.addModalScroll}
            contentContainerStyle={styles.addModalScrollContent}
          >
            <ThemedView
              style={[
                styles.addModalContent,
                { backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Add Missing Responses
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.closeButton}
                >
                  <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.addDateText}>
                {formatDate(addDate)}
              </ThemedText>

              {getUnansweredQuestions(addDate).map((question, index) => {
                const currentValue = addResponses.get(question.id) ?? null;
                return (
                  <View
                    key={question.id}
                    style={[
                      styles.addQuestionCard,
                      {
                        backgroundColor: colorScheme === 'light' ? '#f5f5f5' : '#2a2a2a',
                      },
                    ]}
                  >
                    <ThemedText style={styles.addQuestionText}>
                      {question.text}
                    </ThemedText>
                    <View style={styles.addRatingContainer}>
                      <RatingScale
                        value={currentValue}
                        onValueChange={(value) => {
                          setAddResponses((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(question.id, value);
                            return newMap;
                          });
                        }}
                      />
                    </View>
                  </View>
                );
              })}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    {
                      backgroundColor: colors.tint,
                      opacity:
                        addResponses.size === getUnansweredQuestions(addDate).length
                          ? 1
                          : 0.5,
                    },
                  ]}
                  onPress={handleSaveAddResponses}
                  disabled={addResponses.size !== getUnansweredQuestions(addDate).length}
                >
                  <ThemedText
                    style={[
                      styles.modalButtonText,
                      { color: colorScheme === 'light' ? '#fff' : Colors.dark.background },
                    ]}
                  >
                    Save All
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ScrollView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  responseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  responseContent: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 15,
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  responseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  missingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    opacity: 0.7,
  },
  missingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  editQuestionText: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  editRatingContainer: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addModalScroll: {
    flex: 1,
    width: '100%',
  },
  addModalScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  addModalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 16,
    padding: 20,
  },
  addDateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  addQuestionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addQuestionText: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },
  addRatingContainer: {
    marginTop: 8,
  },
});
