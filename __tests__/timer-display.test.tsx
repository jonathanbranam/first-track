import React from 'react';
import { render } from '@testing-library/react-native';
import { TimerDisplay, formatDuration } from '@/components/timer-display';

describe('TimerDisplay', () => {
  describe('formatDuration', () => {
    it('should format 0 milliseconds correctly', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(5000)).toBe('00:00:05');
      expect(formatDuration(45000)).toBe('00:00:45');
    });

    it('should format minutes correctly', () => {
      expect(formatDuration(60000)).toBe('00:01:00');
      expect(formatDuration(125000)).toBe('00:02:05');
      expect(formatDuration(3599000)).toBe('00:59:59');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(3600000)).toBe('01:00:00');
      expect(formatDuration(7265000)).toBe('02:01:05');
      expect(formatDuration(36000000)).toBe('10:00:00');
    });

    it('should pad single digits with zeros', () => {
      expect(formatDuration(3661000)).toBe('01:01:01');
      expect(formatDuration(3665000)).toBe('01:01:05');
    });
  });

  describe('TimerDisplay component', () => {
    it('should render with initial time', () => {
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      const { getByText } = render(
        <TimerDisplay startTime={startTime} isPaused={false} />
      );

      // Should show approximately 5 seconds
      expect(getByText(/00:00:0[45]/)).toBeTruthy();
    });

    it('should display 00:00:00 for just-started timer', () => {
      const startTime = Date.now();
      const { getByText } = render(
        <TimerDisplay startTime={startTime} isPaused={false} />
      );

      expect(getByText('00:00:00')).toBeTruthy();
    });

    it('should exclude paused time from elapsed calculation', () => {
      const now = Date.now();
      const startTime = now - 10000; // Started 10 seconds ago
      const pauseIntervals = [
        { pausedAt: now - 7000, resumedAt: now - 5000 }, // Paused for 2 seconds
      ];

      const { getByText } = render(
        <TimerDisplay
          startTime={startTime}
          pauseIntervals={pauseIntervals}
          isPaused={false}
        />
      );

      // Should show 8 seconds (10 - 2 paused)
      expect(getByText(/00:00:0[78]/)).toBeTruthy();
    });

    it('should handle multiple pause intervals', () => {
      const now = Date.now();
      const startTime = now - 20000; // Started 20 seconds ago
      const pauseIntervals = [
        { pausedAt: now - 15000, resumedAt: now - 13000 }, // Paused for 2 seconds
        { pausedAt: now - 8000, resumedAt: now - 5000 },   // Paused for 3 seconds
      ];

      const { getByText } = render(
        <TimerDisplay
          startTime={startTime}
          pauseIntervals={pauseIntervals}
          isPaused={false}
        />
      );

      // Should show 15 seconds (20 - 5 paused)
      expect(getByText(/00:00:1[45]/)).toBeTruthy();
    });

    it('should handle currently paused state', () => {
      const now = Date.now();
      const startTime = now - 10000; // Started 10 seconds ago
      const pausedAt = now - 2000; // Paused 2 seconds ago
      const pauseIntervals = [
        { pausedAt, resumedAt: undefined },
      ];

      const { getByText } = render(
        <TimerDisplay
          startTime={startTime}
          pauseIntervals={pauseIntervals}
          isPaused={true}
        />
      );

      // Should show 8 seconds (10 - 2 paused)
      expect(getByText(/00:00:0[78]/)).toBeTruthy();
    });

    it('should apply custom style prop', () => {
      const startTime = Date.now();
      const customStyle = { padding: 40 };
      const { getByText } = render(
        <TimerDisplay
          startTime={startTime}
          isPaused={false}
          style={customStyle}
        />
      );

      const timerText = getByText('00:00:00');
      expect(timerText).toBeTruthy();
    });

    it('should render without pauseIntervals prop', () => {
      const startTime = Date.now() - 3000;
      const { getByText } = render(
        <TimerDisplay startTime={startTime} isPaused={false} />
      );

      // Should render successfully
      expect(getByText(/00:00:0[23]/)).toBeTruthy();
    });
  });
});
