/**
 * Task data models for task management
 */

/**
 * Task represents an individual task item in a task list
 */
export interface Task {
  id: string;
  description: string;
  notes?: string; // Optional notes/details field for expanded task information
  completed: boolean;
  deletedAt?: number;
}
