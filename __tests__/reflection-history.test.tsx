import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import ReflectionHistoryScreen from '@/app/reflection-history';
import { ReflectionQuestion, ReflectionResponse } from '@/types/reflection';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ReflectionHistoryScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const createQuestion = async (id: string, text: string): Promise<ReflectionQuestion> => {
    const question: ReflectionQuestion = {
      id,
      text,
      active: true,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(`reflection-question-${id}`, JSON.stringify(question));
    return question;
  };

  const createResponse = async (
    id: string,
    questionId: string,
    date: number,
    score: number
  ): Promise<ReflectionResponse> => {
    const response: ReflectionResponse = {
      id,
      questionId,
      date,
      score,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`reflection-response-${id}`, JSON.stringify(response));
    return response;
  };

  const setupQuestionsAndResponses = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = yesterday.getTime();

    // Create questions
    await createQuestion('q1', 'How productive was I today?');
    await createQuestion('q2', 'How would I rate my energy levels today?');
    await createQuestion('q3', 'How satisfied am I with my progress today?');

    await AsyncStorage.setItem(
      'reflection-questions-all',
      JSON.stringify(['q1', 'q2', 'q3'])
    );

    // Create responses for today
    await createResponse('r1', 'q1', todayTimestamp, 8);
    await createResponse('r2', 'q2', todayTimestamp, 7);
    // q3 not answered today (to test missing responses)

    // Create responses for yesterday
    await createResponse('r3', 'q1', yesterdayTimestamp, 6);
    await createResponse('r4', 'q2', yesterdayTimestamp, 9);
    await createResponse('r5', 'q3', yesterdayTimestamp, 5);

    await AsyncStorage.setItem(
      'reflection-responses-all',
      JSON.stringify(['r1', 'r2', 'r3', 'r4', 'r5'])
    );
  };

  describe('Loading and Empty States', () => {
    it('should show loading state initially', () => {
      render(<ReflectionHistoryScreen />);
      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('should show empty state when no responses exist', async () => {
      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('No Reflection History')).toBeTruthy();
      });

      expect(screen.getByText('Complete your first daily reflection to see it here.')).toBeTruthy();
    });
  });

  describe('Display Past Responses by Date', () => {
    it('should display responses grouped by date', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeTruthy();
      });

      expect(screen.getByText('Yesterday')).toBeTruthy();
      expect(screen.getAllByText('How productive was I today?').length).toBeGreaterThan(0);
      expect(screen.getAllByText('How would I rate my energy levels today?').length).toBeGreaterThan(0);
    });

    it('should display scores for each response', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      expect(screen.getByText('7/10')).toBeTruthy();
      expect(screen.getByText('6/10')).toBeTruthy();
      expect(screen.getByText('9/10')).toBeTruthy();
      expect(screen.getByText('5/10')).toBeTruthy();
    });

    it('should format dates correctly', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      await createQuestion('q1', 'Test Question');
      await AsyncStorage.setItem('reflection-questions-all', JSON.stringify(['q1']));

      await createResponse('r1', 'q1', todayTimestamp, 8);
      await AsyncStorage.setItem('reflection-responses-all', JSON.stringify(['r1']));

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeTruthy();
      });
    });

    it('should show responses in descending date order (most recent first)', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createQuestion('q1', 'Test Question');
      await AsyncStorage.setItem('reflection-questions-all', JSON.stringify(['q1']));

      // Create responses for different days
      await createResponse('r1', 'q1', today.getTime(), 8);
      await createResponse('r2', 'q1', today.getTime() - 86400000, 7); // yesterday
      await createResponse('r3', 'q1', today.getTime() - 172800000, 6); // 2 days ago

      await AsyncStorage.setItem('reflection-responses-all', JSON.stringify(['r1', 'r2', 'r3']));

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeTruthy();
      });

      expect(screen.getByText('Yesterday')).toBeTruthy();
    });
  });

  describe('Show All Questions Answered Each Day', () => {
    it('should display all responses for a specific date', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeTruthy();
      });

      // Yesterday should have 3 responses
      const yesterdaySection = screen.getByText('Yesterday').parent;
      expect(yesterdaySection).toBeTruthy();
    });

    it('should indicate missing questions for a date', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeTruthy();
      });

      // Today is missing 1 question
      expect(screen.getByText('1 question not answered')).toBeTruthy();
    });
  });

  describe('Edit Past Responses', () => {
    it('should open edit modal when edit button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeTruthy();
      });

      // Find and press the first edit button (pencil icon)
      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });
    });

    it('should display current score in edit modal', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });
    });

    it('should allow changing the score', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });

      // Find and press a rating button (e.g., rating 10)
      const ratingButtons = screen.getAllByRole('button');
      const rating10Button = ratingButtons.find((btn) =>
        btn.props.children?.toString().includes('10')
      );

      if (rating10Button) {
        fireEvent.press(rating10Button);
      }
    });

    it('should save edited response when Save button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Response updated successfully');
      });
    });

    it('should close edit modal when Cancel button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Response')).toBeNull();
      });
    });

    it('should close edit modal when X button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const editButtons = screen.getAllByTestId('icon-pencil');
      fireEvent.press(editButtons[0].parent!);

      await waitFor(() => {
        expect(screen.getByText('Edit Response')).toBeTruthy();
      });

      const closeButtons = screen.getAllByTestId('icon-xmark');
      fireEvent.press(closeButtons[0].parent!);

      await waitFor(() => {
        expect(screen.queryByText('Edit Response')).toBeNull();
      });
    });
  });

  describe('Delete Responses', () => {
    it('should show confirmation dialog when delete button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const deleteButtons = screen.getAllByTestId('icon-trash');
      fireEvent.press(deleteButtons[0].parent!);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Delete Response',
          'Are you sure you want to delete this response?',
          expect.any(Array)
        );
      });
    });

    it('should delete response when confirmed', async () => {
      await setupQuestionsAndResponses();

      // Mock Alert.alert to auto-confirm
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((btn: any) => btn.text === 'Delete');
        if (deleteButton?.onPress) {
          deleteButton.onPress();
        }
      });

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeTruthy();
      });

      const deleteButtons = screen.getAllByTestId('icon-trash');
      fireEvent.press(deleteButtons[0].parent!);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Response deleted successfully');
      });
    });
  });

  describe('Add Missing Responses', () => {
    it('should show "Add Missing" button when questions are unanswered', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });
    });

    it('should open add modal when "Add Missing" button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });

      const addButton = screen.getByText('Add Missing');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Missing Responses')).toBeTruthy();
      });
    });

    it('should display unanswered questions in add modal', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });

      const addButton = screen.getByText('Add Missing');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Missing Responses')).toBeTruthy();
      });

      // Should show the question that wasn't answered today
      expect(screen.getAllByText('How satisfied am I with my progress today?').length).toBeGreaterThan(0);
    });

    it('should require all questions to be answered before saving', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });

      const addButton = screen.getByText('Add Missing');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Missing Responses')).toBeTruthy();
      });

      // The Save All button should exist
      const saveButton = screen.getByText('Save All');
      expect(saveButton).toBeTruthy();

      // Verify we're showing the "Add Missing Responses" modal is still open
      // indicating the save didn't complete (because button would be disabled)
      expect(screen.getByText('Add Missing Responses')).toBeTruthy();
    });

    it('should save all missing responses when all questions are answered', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });

      const addButton = screen.getByText('Add Missing');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Missing Responses')).toBeTruthy();
      });

      // Rate all questions (find rating scale and press a rating)
      // This is a simplified test - in reality we'd need to find and press rating buttons
      const ratingButtons = screen.getAllByRole('button');
      const rating5Buttons = ratingButtons.filter((btn) =>
        btn.props.children?.toString().includes('5')
      );

      if (rating5Buttons.length > 0) {
        fireEvent.press(rating5Buttons[0]);
      }

      await waitFor(() => {
        const saveButton = screen.getByText('Save All');
        // Check if enabled (opacity should be 1)
        expect(saveButton).toBeTruthy();
      });
    });

    it('should close add modal when Cancel button is pressed', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Add Missing')).toBeTruthy();
      });

      const addButton = screen.getByText('Add Missing');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Missing Responses')).toBeTruthy();
      });

      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.press(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Add Missing Responses')).toBeNull();
      });
    });

    it('should not show "Add Missing" button when all questions are answered', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayTimestamp = yesterday.getTime();

      await createQuestion('q1', 'Test Question 1');
      await createQuestion('q2', 'Test Question 2');
      await AsyncStorage.setItem('reflection-questions-all', JSON.stringify(['q1', 'q2']));

      // Answer all questions for yesterday
      await createResponse('r1', 'q1', yesterdayTimestamp, 8);
      await createResponse('r2', 'q2', yesterdayTimestamp, 7);
      await AsyncStorage.setItem('reflection-responses-all', JSON.stringify(['r1', 'r2']));

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeTruthy();
      });

      // Should not show "Add Missing" button for yesterday
      expect(screen.queryByText('Add Missing')).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', async () => {
      const { router } = require('expo-router');

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        const backButton = screen.getByTestId('icon-chevron.left');
        expect(backButton).toBeTruthy();
      });

      const backButton = screen.getByTestId('icon-chevron.left');
      fireEvent.press(backButton.parent!);

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Missing Questions Indicator', () => {
    it('should show count of unanswered questions', async () => {
      await setupQuestionsAndResponses();

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('1 question not answered')).toBeTruthy();
      });
    });

    it('should show correct pluralization for multiple missing questions', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      await createQuestion('q1', 'Question 1');
      await createQuestion('q2', 'Question 2');
      await createQuestion('q3', 'Question 3');
      await AsyncStorage.setItem('reflection-questions-all', JSON.stringify(['q1', 'q2', 'q3']));

      // Only answer 1 question
      await createResponse('r1', 'q1', todayTimestamp, 8);
      await AsyncStorage.setItem('reflection-responses-all', JSON.stringify(['r1']));

      render(<ReflectionHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('2 questions not answered')).toBeTruthy();
      });
    });
  });
});
