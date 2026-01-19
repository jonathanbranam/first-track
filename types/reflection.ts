/**
 * Reflection data models for daily assessment and reflection tracking
 */

/**
 * ReflectionQuestion represents a question used in daily reflections
 */
export interface ReflectionQuestion {
  id: string;
  text: string; // The question text (e.g., "How productive was I today?")
  active: boolean; // Whether this question is active or archived
  createdAt: number; // timestamp when question was created
  deactivatedAt?: number; // timestamp when deactivated (if inactive)
}

/**
 * ReflectionResponse represents a user's response to a reflection question
 */
export interface ReflectionResponse {
  id: string;
  questionId: string; // reference to the question being answered
  date: number; // the date being reflected on (midnight timestamp)
  score: number; // 0-10 scale rating
  timestamp: number; // when the response was recorded
}

/**
 * Helper type for reflection statistics
 */
export interface ReflectionStats {
  questionId: string;
  averageScore: number; // average across all responses
  responseCount: number; // total number of responses
  lastResponseDate: number; // timestamp of last response
  highScore: number; // highest score recorded
  lowScore: number; // lowest score recorded
  sevenDayAverage?: number; // average of last 7 days (if available)
  thirtyDayAverage?: number; // average of last 30 days (if available)
}
