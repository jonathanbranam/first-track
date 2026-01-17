import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerScreen from '@/app/(tabs)/timer';
import { useActivities, useActivitySession } from '@/hooks/use-activities';
import { Activity } from '@/types/activity';

// Mock the hooks
jest.mock('@/hooks/use-activities');

describe('TimerScreen', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Coding',
      category: 'Work',
      color: '#4ECDC4',
      active: true,
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'Exercise',
      category: 'Health',
      color: '#98D8C8',
      active: true,
      createdAt: Date.now(),
    },
  ];

  const mockStartActivity = jest.fn();
  const mockPauseActivity = jest.fn();
  const mockResumeActivity = jest.fn();
  const mockStopActivity = jest.fn();

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Default mock implementation
    (useActivities as jest.Mock).mockReturnValue({
      activeActivities: mockActivities,
      loading: false,
    });

    (useActivitySession as jest.Mock).mockReturnValue({
      session: null,
      startActivity: mockStartActivity,
      pauseActivity: mockPauseActivity,
      resumeActivity: mockResumeActivity,
      stopActivity: mockStopActivity,
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no active session', () => {
      const { getByText } = render(<TimerScreen />);

      expect(getByText('No Active Timer')).toBeTruthy();
      expect(getByText('Start tracking time on an activity')).toBeTruthy();
      expect(getByText('Start Activity')).toBeTruthy();
    });

    it('should show message when no activities available', () => {
      (useActivities as jest.Mock).mockReturnValue({
        activeActivities: [],
        loading: false,
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('No active activities. Create one in Settings.')).toBeTruthy();
    });

    it('should open activity picker when Start Activity is pressed', () => {
      const { getByText } = render(<TimerScreen />);

      const startButton = getByText('Start Activity');
      fireEvent.press(startButton);

      expect(getByText('Select Activity')).toBeTruthy();
    });
  });

  describe('Active Session - Running', () => {
    beforeEach(() => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [],
        },
        startActivity: mockStartActivity,
        pauseActivity: mockPauseActivity,
        resumeActivity: mockResumeActivity,
        stopActivity: mockStopActivity,
      });
    });

    it('should display activity name and category', () => {
      const { getByText } = render(<TimerScreen />);

      expect(getByText('Coding')).toBeTruthy();
      expect(getByText('Work')).toBeTruthy();
    });

    it('should display timer in running state', () => {
      const { getByText } = render(<TimerScreen />);

      expect(getByText('Running')).toBeTruthy();
      expect(getByText('Pause')).toBeTruthy();
      expect(getByText('Stop & Save')).toBeTruthy();
    });

    it('should call pauseActivity when Pause is pressed', () => {
      const { getByText } = render(<TimerScreen />);

      const pauseButton = getByText('Pause');
      fireEvent.press(pauseButton);

      expect(mockPauseActivity).toHaveBeenCalled();
    });

    it('should call stopActivity when Stop is pressed', () => {
      const { getByText } = render(<TimerScreen />);

      const stopButton = getByText('Stop & Save');
      fireEvent.press(stopButton);

      expect(mockStopActivity).toHaveBeenCalled();
    });
  });

  describe('Active Session - Paused', () => {
    beforeEach(() => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 10000,
            duration: 0,
            pauseIntervals: [
              { pausedAt: Date.now() - 2000, resumedAt: undefined },
            ],
          },
          isPaused: true,
          pausedActivityStack: [],
        },
        startActivity: mockStartActivity,
        pauseActivity: mockPauseActivity,
        resumeActivity: mockResumeActivity,
        stopActivity: mockStopActivity,
      });
    });

    it('should display paused state', () => {
      const { getByText } = render(<TimerScreen />);

      expect(getByText('Paused')).toBeTruthy();
      expect(getByText('Resume')).toBeTruthy();
      expect(getByText('Stop & Save')).toBeTruthy();
    });

    it('should call resumeActivity when Resume is pressed', () => {
      const { getByText } = render(<TimerScreen />);

      const resumeButton = getByText('Resume');
      fireEvent.press(resumeButton);

      expect(mockResumeActivity).toHaveBeenCalled();
    });

    it('should call stopActivity when Stop is pressed while paused', () => {
      const { getByText } = render(<TimerScreen />);

      const stopButton = getByText('Stop & Save');
      fireEvent.press(stopButton);

      expect(mockStopActivity).toHaveBeenCalled();
    });
  });

  describe('Activity Selection', () => {
    it('should start activity when selected from picker', () => {
      const { getByText } = render(<TimerScreen />);

      // Open picker
      fireEvent.press(getByText('Start Activity'));
      expect(getByText('Select Activity')).toBeTruthy();

      // Select activity
      fireEvent.press(getByText('Coding'));

      expect(mockStartActivity).toHaveBeenCalledWith('1');
    });
  });

  describe('Activity Details Display', () => {
    it('should display activity without category', () => {
      const activityWithoutCategory: Activity = {
        id: '3',
        name: 'Task',
        active: true,
        createdAt: Date.now(),
      };

      (useActivities as jest.Mock).mockReturnValue({
        activeActivities: [activityWithoutCategory],
        loading: false,
      });

      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '3',
            startTime: Date.now(),
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [],
        },
        startActivity: mockStartActivity,
        pauseActivity: mockPauseActivity,
        resumeActivity: mockResumeActivity,
        stopActivity: mockStopActivity,
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('Task')).toBeTruthy();
    });

    it('should display activity without color', () => {
      const activityWithoutColor: Activity = {
        id: '3',
        name: 'Task',
        category: 'Work',
        active: true,
        createdAt: Date.now(),
      };

      (useActivities as jest.Mock).mockReturnValue({
        activeActivities: [activityWithoutColor],
        loading: false,
      });

      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '3',
            startTime: Date.now(),
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [],
        },
        startActivity: mockStartActivity,
        pauseActivity: mockPauseActivity,
        resumeActivity: mockResumeActivity,
        stopActivity: mockStopActivity,
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('Task')).toBeTruthy();
      expect(getByText('Work')).toBeTruthy();
    });
  });

  describe('Activity Stack', () => {
    it('should display stack badge when there are paused activities', () => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [
            {
              id: '2',
              activityId: '2',
              startTime: Date.now() - 10000,
              duration: 0,
              pauseIntervals: [{ pausedAt: Date.now() - 5000 }],
            },
          ],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: jest.fn(),
        resumeFromStack: jest.fn(),
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('1')).toBeTruthy(); // Stack badge with count
    });

    it('should display switch activity button when timer is running', () => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: jest.fn(),
        resumeFromStack: jest.fn(),
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('Switch Activity')).toBeTruthy();
    });

    it('should display paused activities list when stack is not empty', () => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [
            {
              id: '2',
              activityId: '2',
              startTime: Date.now() - 10000,
              duration: 0,
              pauseIntervals: [{ pausedAt: Date.now() - 5000 }],
            },
          ],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: jest.fn(),
        resumeFromStack: jest.fn(),
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('Paused Activities (1)')).toBeTruthy();
      expect(getByText('Exercise')).toBeTruthy(); // activity-2 is Exercise
    });

    it('should call switchActivity when Switch Activity button is pressed', () => {
      const mockSwitchActivity = jest.fn();
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: mockSwitchActivity,
        resumeFromStack: jest.fn(),
      });

      const { getByText } = render(<TimerScreen />);

      // Click Switch Activity button
      fireEvent.press(getByText('Switch Activity'));

      // Should open activity picker
      expect(getByText('Select Activity')).toBeTruthy();

      // Select an activity
      fireEvent.press(getByText('Exercise'));

      expect(mockSwitchActivity).toHaveBeenCalledWith('2');
    });

    it('should call resumeFromStack when paused activity is pressed', () => {
      const mockResumeFromStack = jest.fn();
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [
            {
              id: '2',
              activityId: '2',
              startTime: Date.now() - 10000,
              duration: 0,
              pauseIntervals: [{ pausedAt: Date.now() - 5000 }],
            },
          ],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: jest.fn(),
        resumeFromStack: mockResumeFromStack,
      });

      const { getAllByText } = render(<TimerScreen />);

      // Find and click the paused activity (Exercise appears twice: once in stack, once in picker)
      const exerciseButtons = getAllByText('Exercise');
      // The first one should be in the stack list
      fireEvent.press(exerciseButtons[0]);

      expect(mockResumeFromStack).toHaveBeenCalledWith(0);
    });

    it('should display multiple paused activities in stack', () => {
      (useActivitySession as jest.Mock).mockReturnValue({
        session: {
          currentLog: {
            id: '1',
            activityId: '1',
            startTime: Date.now() - 5000,
            duration: 0,
            pauseIntervals: [],
          },
          isPaused: false,
          pausedActivityStack: [
            {
              id: '2',
              activityId: '2',
              startTime: Date.now() - 10000,
              duration: 0,
              pauseIntervals: [{ pausedAt: Date.now() - 5000 }],
            },
            {
              id: '3',
              activityId: '1', // Same activity as current but different log
              startTime: Date.now() - 15000,
              duration: 0,
              pauseIntervals: [{ pausedAt: Date.now() - 8000 }],
            },
          ],
        },
        startActivity: jest.fn(),
        pauseActivity: jest.fn(),
        resumeActivity: jest.fn(),
        stopActivity: jest.fn(),
        switchActivity: jest.fn(),
        resumeFromStack: jest.fn(),
      });

      const { getByText } = render(<TimerScreen />);

      expect(getByText('Paused Activities (2)')).toBeTruthy();
      expect(getByText('2')).toBeTruthy(); // Stack badge
    });
  });
});
