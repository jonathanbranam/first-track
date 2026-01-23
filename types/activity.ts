/**
 * Activity data models for time tracking
 */

/**
 * ActivityType represents a category or type of activity (e.g., "Work", "Exercise", "Learning")
 * This is configured in settings and used to categorize activity instances
 */
export interface ActivityType {
  id: string;
  name: string; // e.g., "Work", "Exercise", "Learning"
  color: string; // hex color code for visual identification
  active: boolean; // whether this type is active or archived
  createdAt: number; // timestamp
  deactivatedAt?: number; // timestamp when deactivated
}

/**
 * Activity represents a trackable activity/project that can be timed
 */
export interface Activity {
  id: string;
  name: string;
  category?: string; // work, home, personal, etc. - DEPRECATED: use typeId instead
  typeId?: string; // reference to ActivityType
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
