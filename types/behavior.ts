/**
 * Behavior data models for habit and behavior tracking
 */

/**
 * BehaviorType defines the kind of measurement for the behavior
 */
export type BehaviorType = 'reps' | 'duration' | 'weight' | 'count';

/**
 * Behavior represents a trackable habit or behavior
 */
export interface Behavior {
  id: string;
  name: string; // e.g., "Pushups", "Squats", "Meditation"
  type: BehaviorType; // what kind of measurement (reps, duration, weight, count)
  units: string; // e.g., "reps", "minutes", "kg", "lbs", "count"
  active: boolean; // whether this behavior is active or archived
  createdAt: number; // timestamp
  deactivatedAt?: number; // timestamp when deactivated
}

/**
 * BehaviorLog represents a single instance of logging a behavior
 */
export interface BehaviorLog {
  id: string;
  behaviorId: string; // reference to the behavior being logged
  timestamp: number; // when the behavior was logged
  quantity: number; // e.g., 15 reps, 30 minutes, 100 count
  weight?: number; // optional weight/resistance (e.g., 10 kg, 25 lbs)
  notes?: string; // optional notes about this log entry
}

/**
 * Helper type for behavior statistics
 */
export interface BehaviorStats {
  behaviorId: string;
  totalQuantity: number; // total quantity across all logs
  logCount: number; // number of log entries
  averageQuantity: number; // average quantity per log
  lastLogDate: number; // timestamp of last log
}
