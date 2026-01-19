import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useReflectionQuestions, useReflectionResponses } from '@/hooks/use-reflections';
import { ReflectionQuestion, ReflectionResponse } from '@/types/reflection';

describe('Reflection Hooks', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('useReflectionQuestions', () => {
    it('should start with empty questions list', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.activeQuestions).toEqual([]);
    });

    it('should create a new reflection question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdQuestion: ReflectionQuestion | undefined;
      await act(async () => {
        createdQuestion = await result.current.createQuestion({
          text: 'How productive was I today?',
        });
      });

      expect(createdQuestion).toBeDefined();
      expect(createdQuestion?.text).toBe('How productive was I today?');
      expect(createdQuestion?.active).toBe(true);
      expect(createdQuestion?.id).toBeDefined();
      expect(createdQuestion?.createdAt).toBeDefined();

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(1);
        expect(result.current.questions[0].text).toBe('How productive was I today?');
      });
    });

    it('should create multiple reflection questions', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add small delay between questions to ensure unique IDs
      await act(async () => {
        await result.current.createQuestion({
          text: 'How productive was I today?',
        });
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(1);
      });

      await act(async () => {
        await result.current.createQuestion({
          text: 'How would I rate my energy levels today?',
        });
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(2);
      });

      await act(async () => {
        await result.current.createQuestion({
          text: 'How satisfied am I with my progress today?',
        });
      });

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(3);
      });

      // Check that all questions exist
      expect(result.current.questions.find((q) => q.text.includes('productive'))).toBeDefined();
      expect(result.current.questions.find((q) => q.text.includes('energy'))).toBeDefined();
      expect(result.current.questions.find((q) => q.text.includes('satisfied'))).toBeDefined();
    });

    it('should update an existing question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let questionId: string = '';
      await act(async () => {
        const question = await result.current.createQuestion({
          text: 'How productive was I today?',
        });
        questionId = question.id;
      });

      await act(async () => {
        await result.current.updateQuestion(questionId, {
          text: 'How would I rate my productivity today?',
        });
      });

      await waitFor(() => {
        const updatedQuestion = result.current.questions.find((q) => q.id === questionId);
        expect(updatedQuestion?.text).toBe('How would I rate my productivity today?');
      });
    });

    it('should deactivate a question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let questionId: string = '';
      await act(async () => {
        const question = await result.current.createQuestion({
          text: 'How productive was I today?',
        });
        questionId = question.id;
      });

      await act(async () => {
        await result.current.deactivateQuestion(questionId);
      });

      await waitFor(() => {
        expect(result.current.activeQuestions).toHaveLength(0);
        expect(result.current.inactiveQuestions).toHaveLength(1);
        const deactivated = result.current.inactiveQuestions[0];
        expect(deactivated.active).toBe(false);
        expect(deactivated.deactivatedAt).toBeDefined();
      });
    });

    it('should reactivate a question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let questionId: string = '';
      await act(async () => {
        const question = await result.current.createQuestion({
          text: 'How productive was I today?',
        });
        questionId = question.id;
      });

      await act(async () => {
        await result.current.deactivateQuestion(questionId);
      });

      await act(async () => {
        await result.current.reactivateQuestion(questionId);
      });

      await waitFor(() => {
        expect(result.current.activeQuestions).toHaveLength(1);
        expect(result.current.inactiveQuestions).toHaveLength(0);
        const reactivated = result.current.activeQuestions[0];
        expect(reactivated.active).toBe(true);
        expect(reactivated.deactivatedAt).toBeUndefined();
      });
    });

    it('should delete a question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let questionId: string = '';
      await act(async () => {
        const question = await result.current.createQuestion({
          text: 'How productive was I today?',
        });
        questionId = question.id;
      });

      await act(async () => {
        await result.current.deleteQuestion(questionId);
      });

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(0);
      });

      // Verify it's actually deleted from storage
      const stored = await AsyncStorage.getItem(`reflection-question-${questionId}`);
      expect(stored).toBeNull();
    });

    it('should load existing questions from storage', async () => {
      const question1: ReflectionQuestion = {
        id: '1',
        text: 'How productive was I today?',
        active: true,
        createdAt: Date.now(),
      };
      const question2: ReflectionQuestion = {
        id: '2',
        text: 'How would I rate my energy levels today?',
        active: true,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('reflection-questions-all', JSON.stringify(['1', '2']));
      await AsyncStorage.setItem('reflection-question-1', JSON.stringify(question1));
      await AsyncStorage.setItem('reflection-question-2', JSON.stringify(question2));

      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions[0].text).toBe('How productive was I today?');
      expect(result.current.questions[1].text).toBe('How would I rate my energy levels today?');
    });

    it('should create default questions', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call createDefaultQuestions
      await act(async () => {
        await result.current.createDefaultQuestions();
      });

      // Give time for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually refresh to load all questions from storage
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that default questions were created by checking storage directly
      const stored = await AsyncStorage.getItem('reflection-questions-all');
      expect(stored).not.toBeNull();
      const questionIds = JSON.parse(stored!);
      expect(questionIds.length).toBeGreaterThanOrEqual(6);

      // Verify some specific questions exist in the loaded list
      await waitFor(() => {
        expect(result.current.questions.length).toBeGreaterThanOrEqual(6);
      });
    }, 15000);

    it('should throw error when updating non-existent question', async () => {
      const { result } = renderHook(() => useReflectionQuestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateQuestion('non-existent-id', { text: 'New Question' });
        });
      }).rejects.toThrow('Reflection question not found');
    });
  });

  describe('useReflectionResponses', () => {
    it('should start with empty responses list', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responses).toEqual([]);
    });

    it('should create a new reflection response', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const dateTimestamp = date.getTime();

      let createdResponse: ReflectionResponse | undefined;
      await act(async () => {
        createdResponse = await result.current.createResponse({
          questionId: 'question-1',
          date: dateTimestamp,
          score: 8,
        });
      });

      expect(createdResponse).toBeDefined();
      expect(createdResponse?.questionId).toBe('question-1');
      expect(createdResponse?.date).toBe(dateTimestamp);
      expect(createdResponse?.score).toBe(8);
      expect(createdResponse?.id).toBeDefined();
      expect(createdResponse?.timestamp).toBeDefined();

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(1);
      });
    });

    it('should create responses with different scores', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const dateTimestamp = date.getTime();

      await act(async () => {
        await result.current.createResponse({
          questionId: 'question-1',
          date: dateTimestamp,
          score: 0,
        });
        await result.current.createResponse({
          questionId: 'question-2',
          date: dateTimestamp,
          score: 5,
        });
        await result.current.createResponse({
          questionId: 'question-3',
          date: dateTimestamp,
          score: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
        expect(result.current.responses.find((r) => r.score === 0)).toBeDefined();
        expect(result.current.responses.find((r) => r.score === 5)).toBeDefined();
        expect(result.current.responses.find((r) => r.score === 10)).toBeDefined();
      });
    });

    it('should update an existing response', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      let responseId: string = '';
      await act(async () => {
        const response = await result.current.createResponse({
          questionId: 'question-1',
          date: date.getTime(),
          score: 8,
        });
        responseId = response.id;
      });

      await act(async () => {
        await result.current.updateResponse(responseId, {
          score: 9,
        });
      });

      await waitFor(() => {
        const updatedResponse = result.current.responses.find((r) => r.id === responseId);
        expect(updatedResponse?.score).toBe(9);
      });
    });

    it('should delete a response', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      let responseId: string = '';
      await act(async () => {
        const response = await result.current.createResponse({
          questionId: 'question-1',
          date: date.getTime(),
          score: 8,
        });
        responseId = response.id;
      });

      await act(async () => {
        await result.current.deleteResponse(responseId);
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(0);
      });

      // Verify it's deleted from storage
      const stored = await AsyncStorage.getItem(`reflection-response-${responseId}`);
      expect(stored).toBeNull();
    });

    it('should filter responses by date range', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTimestamp = yesterday.getTime();

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoTimestamp = twoDaysAgo.getTime();

      // Create responses at different dates
      await act(async () => {
        await result.current.createResponse({
          questionId: 'question-1',
          date: twoDaysAgoTimestamp,
          score: 5,
        });
        await result.current.createResponse({
          questionId: 'question-1',
          date: yesterdayTimestamp,
          score: 7,
        });
        await result.current.createResponse({
          questionId: 'question-1',
          date: todayTimestamp,
          score: 9,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
      });

      // Get responses from yesterday onwards
      const recentResponses = result.current.getResponsesByDateRange(
        yesterdayTimestamp,
        todayTimestamp + 1
      );
      expect(recentResponses).toHaveLength(2);
      expect(recentResponses.some((r) => r.score === 7)).toBe(true);
      expect(recentResponses.some((r) => r.score === 9)).toBe(true);
    });

    it('should get responses for a specific date', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTimestamp = yesterday.getTime();

      // Create responses for different dates
      await act(async () => {
        await result.current.createResponse({
          questionId: 'question-1',
          date: yesterdayTimestamp,
          score: 7,
        });
        await result.current.createResponse({
          questionId: 'question-2',
          date: todayTimestamp,
          score: 8,
        });
        await result.current.createResponse({
          questionId: 'question-3',
          date: todayTimestamp,
          score: 9,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
      });

      const todayResponses = result.current.getResponsesByDate(today);
      expect(todayResponses).toHaveLength(2);
      expect(todayResponses.every((r) => r.date === todayTimestamp)).toBe(true);
    });

    it('should check if question has response for a date', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      await act(async () => {
        await result.current.createResponse({
          questionId: 'question-1',
          date: todayTimestamp,
          score: 8,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(1);
      });

      expect(result.current.hasResponseForDate('question-1', today)).toBe(true);
      expect(result.current.hasResponseForDate('question-2', today)).toBe(false);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(result.current.hasResponseForDate('question-1', yesterday)).toBe(false);
    });

    it('should calculate average score for a question', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create multiple responses for the same question
      await act(async () => {
        await result.current.createResponse({
          questionId: 'question-1',
          date: today.getTime(),
          score: 6,
        });
        await result.current.createResponse({
          questionId: 'question-1',
          date: today.getTime() - 24 * 60 * 60 * 1000,
          score: 8,
        });
        await result.current.createResponse({
          questionId: 'question-1',
          date: today.getTime() - 2 * 24 * 60 * 60 * 1000,
          score: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
      });

      const average = result.current.getAverageScore('question-1');
      expect(average).toBe(8); // (6 + 8 + 10) / 3
    });

    it('should calculate average score for specific number of days', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const now = Date.now();

      // Create responses over multiple days
      await act(async () => {
        // Recent responses (last 7 days)
        await result.current.createResponse({
          questionId: 'question-1',
          date: now,
          score: 8,
        });
        await result.current.createResponse({
          questionId: 'question-1',
          date: now - 3 * 24 * 60 * 60 * 1000,
          score: 9,
        });
        // Old response (30 days ago)
        await result.current.createResponse({
          questionId: 'question-1',
          date: now - 30 * 24 * 60 * 60 * 1000,
          score: 3,
        });
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
      });

      const sevenDayAverage = result.current.getAverageScore('question-1', 7);
      expect(sevenDayAverage).toBe(8.5); // (8 + 9) / 2

      const allTimeAverage = result.current.getAverageScore('question-1');
      expect(allTimeAverage).toBeCloseTo(6.67, 1); // (8 + 9 + 3) / 3
    });

    it('should return null for average when no responses exist', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const average = result.current.getAverageScore('question-1');
      expect(average).toBeNull();
    });

    it('should load existing responses from storage', async () => {
      const response1: ReflectionResponse = {
        id: '1',
        questionId: 'question-1',
        date: Date.now(),
        score: 8,
        timestamp: Date.now(),
      };
      const response2: ReflectionResponse = {
        id: '2',
        questionId: 'question-1',
        date: Date.now(),
        score: 9,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem('reflection-responses-all', JSON.stringify(['1', '2']));
      await AsyncStorage.setItem('reflection-response-1', JSON.stringify(response1));
      await AsyncStorage.setItem('reflection-response-2', JSON.stringify(response2));

      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responses).toHaveLength(2);
      expect(result.current.responses[0].score).toBe(8);
      expect(result.current.responses[1].score).toBe(9);
    });

    it('should throw error when updating non-existent response', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateResponse('non-existent-id', { score: 10 });
        });
      }).rejects.toThrow('Reflection response not found');
    });

    it('should handle creating multiple responses in quick succession', async () => {
      const { result } = renderHook(() => useReflectionResponses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateTimestamp = today.getTime();

      // Create multiple responses quickly
      await act(async () => {
        await Promise.all([
          result.current.createResponse({
            questionId: 'question-1',
            date: dateTimestamp,
            score: 7,
          }),
          result.current.createResponse({
            questionId: 'question-2',
            date: dateTimestamp,
            score: 8,
          }),
          result.current.createResponse({
            questionId: 'question-3',
            date: dateTimestamp,
            score: 9,
          }),
        ]);
      });

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(3);
      });
    });
  });
});
