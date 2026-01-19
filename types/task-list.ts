/**
 * Task List data models for organizing tasks
 */

/**
 * List type for categorizing task lists
 */
export type ListType = 'permanent' | 'temporary' | 'someday';

/**
 * TaskList represents a collection/category of tasks
 */
export interface TaskList {
  id: string;
  name: string;
  emoji: string;
  color: string;
  listType?: ListType; // Optional for backward compatibility with existing lists
}

/**
 * Default color palette for task lists
 */
export const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
];

/**
 * Default emoji options for task lists
 */
export const DEFAULT_EMOJIS = [
  '📝', '✅', '🎯', '💼', '🏠', '💡', '🎨', '📚', '🎵', '⭐',
  '🔥', '💪', '🚀', '📱', '💻', '🎮', '🏃', '🍕', '☕', '🌟',
];
