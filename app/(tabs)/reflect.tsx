import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RatingScale } from '@/components/ui/rating-scale';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReflectionQuestions, useReflectionResponses } from '@/hooks/use-reflections';
import { ReflectionQuestion } from '@/types/reflection';

export default function ReflectScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { activeQuestions, loading: questionsLoading, refresh: refreshQuestions } = useReflectionQuestions();
  const { createResponse, hasResponseForDate } = useReflectionResponses();

  const [responses, setResponses] = useState<Map<string, number>>(new Map());
  const [completedToday, setCompletedToday] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);

  // Get today's date at midnight
  const getTodayMidnight = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  // Check if today's reflection has been completed
  const checkTodayCompletion = useCallback(async () => {
    setCheckingCompletion(true);
    const today = getTodayMidnight();

    if (activeQuestions.length === 0) {
      setCompletedToday(false);
      setCheckingCompletion(false);
      return;
    }

    // Check if all active questions have been answered today
    const completionChecks = await Promise.all(
      activeQuestions.map(async (q) => {
        const hasResponse = await hasResponseForDate(q.id, today);
        return hasResponse;
      })
    );

    const allCompleted = completionChecks.every(Boolean);
    setCompletedToday(allCompleted);
    setCheckingCompletion(false);
  }, [activeQuestions, hasResponseForDate, getTodayMidnight]);

  // Refresh questions when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshQuestions();
    }, [refreshQuestions])
  );

  // Check completion status when questions change
  useEffect(() => {
    if (!questionsLoading) {
      checkTodayCompletion();
    }
  }, [activeQuestions, questionsLoading, checkTodayCompletion]);

  const handleRatingChange = useCallback((questionId: string, value: number) => {
    setResponses((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, value);
      return newMap;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate that all questions have been answered
    const unansweredQuestions = activeQuestions.filter(
      (q) => !responses.has(q.id)
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete Reflection',
        `Please rate all ${activeQuestions.length} questions before submitting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const today = getTodayMidnight();

      // Submit all responses
      await Promise.all(
        Array.from(responses.entries()).map(([questionId, score]) =>
          createResponse({
            questionId,
            date: today,
            score,
          })
        )
      );

      // Show completion message
      setShowCompletion(true);
      setCompletedToday(true);
      setResponses(new Map());

      // Reset completion message after 3 seconds
      setTimeout(() => {
        setShowCompletion(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting reflection:', error);
      Alert.alert(
        'Error',
        'Failed to save your reflection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [activeQuestions, responses, createResponse, getTodayMidnight]);

  const handleStartNew = useCallback(() => {
    setCompletedToday(false);
    setResponses(new Map());
  }, []);

  if (questionsLoading || checkingCompletion) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Daily Reflection
          </ThemedText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/reflection-history')}
          >
            <IconSymbol name="clock" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Daily Reflection
          </ThemedText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/reflection-history')}
          >
            <IconSymbol name="clock" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol
            name="lightbulb"
            size={64}
            color={colors.icon}
            style={styles.emptyIcon}
          />
          <ThemedText style={styles.emptyTitle}>No Active Questions</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Add reflection questions in Settings to start your daily practice.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (completedToday && !showCompletion) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Daily Reflection
          </ThemedText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/reflection-history')}
          >
            <IconSymbol name="clock" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.completedContainer}>
          <IconSymbol
            name="checkmark.circle.fill"
            size={80}
            color={colors.tint}
            style={styles.completedIcon}
          />
          <ThemedText style={styles.completedTitle}>
            Reflection Complete!
          </ThemedText>
          <ThemedText style={styles.completedSubtitle}>
            You've completed today's reflection. Great job!
          </ThemedText>
          <TouchableOpacity
            style={[styles.retakeButton, { backgroundColor: colors.tint }]}
            onPress={handleStartNew}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.retakeButtonText,
                { color: colorScheme === 'light' ? '#fff' : Colors.dark.background },
              ]}
            >
              Retake Reflection
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  if (showCompletion) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Daily Reflection
          </ThemedText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/reflection-history')}
          >
            <IconSymbol name="clock" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.completionContainer}>
          <IconSymbol
            name="checkmark.circle.fill"
            size={100}
            color={colors.tint}
            style={styles.completionIcon}
          />
          <ThemedText style={styles.completionTitle}>
            Thank you!
          </ThemedText>
          <ThemedText style={styles.completionSubtitle}>
            Your reflection has been saved.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Daily Reflection
        </ThemedText>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/reflection-history')}
        >
          <IconSymbol name="clock" size={24} color={colors.tint} />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.introContainer}>
          <ThemedText style={styles.introText}>
            Rate each question on a scale from 0 (low) to 10 (high) based on how you feel today.
          </ThemedText>
        </ThemedView>

        {activeQuestions.map((question, index) => {
          const currentValue = responses.get(question.id) ?? null;
          return (
            <ThemedView
              key={question.id}
              style={[
                styles.questionCard,
                {
                  backgroundColor: colorScheme === 'light' ? '#f5f5f5' : '#2a2a2a',
                },
              ]}
            >
              <View style={styles.questionHeader}>
                <Text
                  style={[
                    styles.questionNumber,
                    { color: colors.tint },
                  ]}
                >
                  {index + 1}/{activeQuestions.length}
                </Text>
              </View>
              <ThemedText style={styles.questionText}>
                {question.text}
              </ThemedText>
              <View style={styles.ratingContainer}>
                <RatingScale
                  value={currentValue}
                  onValueChange={(value) => handleRatingChange(question.id, value)}
                />
              </View>
            </ThemedView>
          );
        })}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.tint,
              opacity: responses.size === activeQuestions.length ? 1 : 0.5,
            },
          ]}
          onPress={handleSubmit}
          disabled={responses.size !== activeQuestions.length}
          activeOpacity={0.8}
        >
          <ThemedText
            style={[
              styles.submitButtonText,
              { color: colorScheme === 'light' ? '#fff' : Colors.dark.background },
            ]}
          >
            Submit Reflection
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyButton: {
    padding: 4,
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
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completedIcon: {
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32,
  },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 18,
    opacity: 0.7,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  introContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 26,
  },
  ratingContainer: {
    marginTop: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
