/**
 * Activity data models for time tracking
 */

/**
 * Activity represents a trackable activity/project that can be timed
 */
export interface Activity {
  id: string;
  name: string;
  category?: string; // work, home, personal, etc.
  color?: string;
  active: boolean; // whether this activity is active or archived
  createdAt: number; // timestamp
  deactivatedAt?: number; // timestamp when deactivated
}

/**
 * PauseInterval represents a period when an activity was paused
 */
export interface PauseInterval {
  pausedAt: number; // timestamp when paused
  resumedAt?: number; // timestamp when resumed (undefined if currently paused)
}

/**
 * ActivityLog represents a completed activity session
 */
export interface ActivityLog {
  id: string;
  activityId: string;
  startTime: number; // timestamp when activity started
  endTime?: number; // timestamp when activity ended (undefined if still running)
  duration: number; // total duration in milliseconds (excluding paused time)
  pauseIntervals: PauseInterval[]; // array of pause/resume intervals
  notes?: string; // optional notes about this session
}

/**
 * ActivitySession represents the current active/paused timer state
 * This is a singleton - only one session can be active at a time
 */
export interface ActivitySession {
  currentLog: ActivityLog; // the current activity log being tracked
  isPaused: boolean; // whether the timer is currently paused
  pausedActivityStack: ActivityLog[]; // stack of paused activities for context switching
}

/**
 * Helper type for activity statistics
 */
export interface ActivityStats {
  activityId: string;
  totalDuration: number; // total time in milliseconds
  sessionCount: number;
  averageDuration: number;
  lastSessionDate: number; // timestamp of last session
}
