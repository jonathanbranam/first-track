/**
 * Timer display component showing elapsed time in HH:MM:SS format
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface TimerDisplayProps {
  startTime: number;
  pauseIntervals?: { pausedAt: number; resumedAt?: number }[];
  isPaused: boolean;
  style?: object;
}

/**
 * Formats milliseconds into HH:MM:SS format
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates the elapsed time excluding paused intervals
 */
function calculateElapsedTime(
  startTime: number,
  pauseIntervals: { pausedAt: number; resumedAt?: number }[],
  isPaused: boolean
): number {
  const now = Date.now();
  const totalElapsed = now - startTime;

  // Calculate total paused time
  let totalPausedTime = 0;
  for (const interval of pauseIntervals) {
    if (interval.resumedAt) {
      totalPausedTime += interval.resumedAt - interval.pausedAt;
    } else if (isPaused) {
      // Currently paused - count up to now
      totalPausedTime += now - interval.pausedAt;
    }
  }

  return totalElapsed - totalPausedTime;
}

/**
 * Timer display component that updates every second
 */
export function TimerDisplay({ startTime, pauseIntervals = [], isPaused, style }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      const currentElapsed = calculateElapsedTime(startTime, pauseIntervals, isPaused);
      setElapsed(currentElapsed);
    };

    // Update immediately
    updateElapsed();

    // Update every second if not paused
    if (!isPaused) {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, pauseIntervals, isPaused]);

  return (
    <View style={[styles.container, style]}>
      <ThemedText style={styles.timerText}>{formatDuration(elapsed)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
