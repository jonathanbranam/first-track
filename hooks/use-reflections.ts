/**
 * Custom hook for managing reflection questions and responses
 */

import { useState, useEffect, useCallback } from 'react';
import { ReflectionQuestion, ReflectionResponse } from '@/types/reflection';
import { useStorage, getStorageItem, setStorageItem, removeStorageItem } from './use-storage';

const QUESTIONS_LIST_KEY = 'all';
const QUESTIONS_LABEL = 'reflection-questions';
const QUESTION_LABEL = 'reflection-question';
const RESPONSES_LABEL = 'reflection-responses';
const RESPONSE_LABEL = 'reflection-response';

/**
 * Hook for managing reflection questions
 */
export function useReflectionQuestions() {
  const { data: questionIds, loading, save: saveQuestionIds, refresh } = useStorage<string[]>(
    QUESTIONS_LABEL,
    QUESTIONS_LIST_KEY
  );
  const [questions, setQuestions] = useState<ReflectionQuestion[]>([]);

  // Load all questions whenever questionIds changes
  useEffect(() => {
    if (!questionIds || loading) return;

    async function loadQuestions() {
      const loaded = await Promise.all(
        questionIds!.map((id) => getStorageItem<ReflectionQuestion>(QUESTION_LABEL, id))
      );
      const validQuestions = loaded.filter((question): question is ReflectionQuestion => question !== null);
      setQuestions(validQuestions);
    }

    loadQuestions();
  }, [questionIds, loading]);

  /**
   * Create a new reflection question
   */
  const createQuestion = useCallback(
    async (question: Omit<ReflectionQuestion, 'id' | 'createdAt' | 'active'>) => {
      const newQuestion: ReflectionQuestion = {
        ...question,
        id: Date.now().toString(),
        createdAt: Date.now(),
        active: true,
      };

      // Save the question
      await setStorageItem(QUESTION_LABEL, newQuestion.id, newQuestion);

      // Update the questions list - read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(QUESTIONS_LABEL, QUESTIONS_LIST_KEY);
      const updatedIds = [...(currentIds || []), newQuestion.id];
      await saveQuestionIds(updatedIds);

      setQuestions((prev) => [...prev, newQuestion]);
      return newQuestion;
    },
    [saveQuestionIds]
  );

  /**
   * Update an existing question
   */
  const updateQuestion = useCallback(async (id: string, updates: Partial<ReflectionQuestion>) => {
    const existing = await getStorageItem<ReflectionQuestion>(QUESTION_LABEL, id);
    if (!existing) throw new Error('Reflection question not found');

    const updated: ReflectionQuestion = { ...existing, ...updates };
    await setStorageItem(QUESTION_LABEL, id, updated);

    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
    return updated;
  }, []);

  /**
   * Delete a question (preserves historical responses)
   */
  const deleteQuestion = useCallback(
    async (id: string) => {
      await removeStorageItem(QUESTION_LABEL, id);

      // Read fresh from storage to avoid stale closure
      const currentIds = await getStorageItem<string[]>(QUESTIONS_LABEL, QUESTIONS_LIST_KEY);
      const updatedIds = (currentIds || []).filter((questionId) => questionId !== id);
      await saveQuestionIds(updatedIds);

      setQuestions((prev) => prev.filter((q) => q.id !== id));
    },
    [saveQuestionIds]
  );

  /**
   * Deactivate a question (soft delete - keeps it in system but marks as inactive)
   */
  const deactivateQuestion = useCallback(
    async (id: string) => {
      return updateQuestion(id, { active: false, deactivatedAt: Date.now() });
    },
    [updateQuestion]
  );

  /**
   * Reactivate a question
   */
  const reactivateQuestion = useCallback(
    async (id: string) => {
      return updateQuestion(id, { active: true, deactivatedAt: undefined });
    },
    [updateQuestion]
  );

  /**
   * Create default reflection questions
   */
  const createDefaultQuestions = useCallback(async () => {
    const defaultQuestions = [
      { text: 'How productive was I today?' },
      { text: 'How would I rate my energy levels today?' },
      { text: 'How satisfied am I with my progress today?' },
      { text: 'How well did I maintain focus today?' },
      { text: 'How would I rate my overall mood today?' },
      { text: 'How well did I take care of my health today?' },
    ];

    for (const question of defaultQuestions) {
      await createQuestion(question);
    }
  }, [createQuestion]);

  return {
    questions,
    activeQuestions: questions.filter((q) => q.active),
    inactiveQuestions: questions.filter((q) => !q.active),
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    deactivateQuestion,
    reactivateQuestion,
    createDefaultQuestions,
    refresh,
  };
}

/**
 * Hook for managing reflection responses
 */
export function useReflectionResponses(questionId?: string) {
  const { data: allResponseIds, loading, save: saveResponseIds, refresh } = useStorage<string[]>(
    RESPONSES_LABEL,
    questionId || 'all'
  );
  const [responses, setResponses] = useState<ReflectionResponse[]>([]);

  // Load all responses whenever responseIds changes
  useEffect(() => {
    if (!allResponseIds || loading) return;

    async function loadResponses() {
      const loaded = await Promise.all(
        allResponseIds!.map((id) => getStorageItem<ReflectionResponse>(RESPONSE_LABEL, id))
      );
      const validResponses = loaded.filter((response): response is ReflectionResponse => response !== null);
      setResponses(validResponses);
    }

    loadResponses();
  }, [allResponseIds, loading]);

  /**
   * Create a new reflection response
   */
  const createResponse = useCallback(
    async (response: Omit<ReflectionResponse, 'id' | 'timestamp'>) => {
      const newResponse: ReflectionResponse = {
        ...response,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      // Save the response
      await setStorageItem(RESPONSE_LABEL, newResponse.id, newResponse);

      // Update the responses list for 'all'
      const allResponsesKey = 'all';
      const allResponseIds = await getStorageItem<string[]>(RESPONSES_LABEL, allResponsesKey);
      const updatedAllIds = [...(allResponseIds || []), newResponse.id];
      await setStorageItem(RESPONSES_LABEL, allResponsesKey, updatedAllIds);

      // Update the responses list for this specific question
      if (response.questionId) {
        const questionResponseIds = await getStorageItem<string[]>(RESPONSES_LABEL, response.questionId);
        const updatedQuestionIds = [...(questionResponseIds || []), newResponse.id];
        await setStorageItem(RESPONSES_LABEL, response.questionId, updatedQuestionIds);
      }

      setResponses((prev) => [...prev, newResponse]);
      return newResponse;
    },
    []
  );

  /**
   * Update an existing response
   */
  const updateResponse = useCallback(async (id: string, updates: Partial<ReflectionResponse>) => {
    const existing = await getStorageItem<ReflectionResponse>(RESPONSE_LABEL, id);
    if (!existing) throw new Error('Reflection response not found');

    const updated: ReflectionResponse = { ...existing, ...updates };
    await setStorageItem(RESPONSE_LABEL, id, updated);

    setResponses((prev) => prev.map((response) => (response.id === id ? updated : response)));
    return updated;
  }, []);

  /**
   * Delete a response
   */
  const deleteResponse = useCallback(
    async (id: string) => {
      const existing = await getStorageItem<ReflectionResponse>(RESPONSE_LABEL, id);
      if (!existing) return;

      await removeStorageItem(RESPONSE_LABEL, id);

      // Remove from 'all' responses list
      const allResponsesKey = 'all';
      const allResponseIds = await getStorageItem<string[]>(RESPONSES_LABEL, allResponsesKey);
      if (allResponseIds) {
        const updatedAllIds = allResponseIds.filter((responseId) => responseId !== id);
        await setStorageItem(RESPONSES_LABEL, allResponsesKey, updatedAllIds);
      }

      // Remove from specific question responses list
      if (existing.questionId) {
        const questionResponseIds = await getStorageItem<string[]>(RESPONSES_LABEL, existing.questionId);
        if (questionResponseIds) {
          const updatedQuestionIds = questionResponseIds.filter((responseId) => responseId !== id);
          await setStorageItem(RESPONSES_LABEL, existing.questionId, updatedQuestionIds);
        }
      }

      setResponses((prev) => prev.filter((response) => response.id !== id));
    },
    []
  );

  /**
   * Get responses for a specific date range
   */
  const getResponsesByDateRange = useCallback(
    (startDate: number, endDate: number) => {
      return responses.filter((response) => response.date >= startDate && response.date <= endDate);
    },
    [responses]
  );

  /**
   * Get responses for a specific date
   */
  const getResponsesByDate = useCallback(
    (date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const dateTimestamp = startOfDay.getTime();

      return responses.filter((response) => response.date === dateTimestamp);
    },
    [responses]
  );

  /**
   * Check if a question has been answered for a specific date
   */
  const hasResponseForDate = useCallback(
    (questionId: string, date: Date | number) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const dateTimestamp = startOfDay.getTime();

      return responses.some(
        (response) => response.questionId === questionId && response.date === dateTimestamp
      );
    },
    [responses]
  );

  /**
   * Get average score for a question
   */
  const getAverageScore = useCallback(
    (questionId: string, days?: number) => {
      let filteredResponses = responses.filter((r) => r.questionId === questionId);

      if (days) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        filteredResponses = filteredResponses.filter((r) => r.date >= cutoffDate);
      }

      if (filteredResponses.length === 0) return null;

      const sum = filteredResponses.reduce((acc, r) => acc + r.score, 0);
      return sum / filteredResponses.length;
    },
    [responses]
  );

  return {
    responses,
    loading,
    createResponse,
    updateResponse,
    deleteResponse,
    getResponsesByDateRange,
    getResponsesByDate,
    hasResponseForDate,
    getAverageScore,
    refresh,
  };
}
