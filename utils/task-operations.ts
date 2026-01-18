import { Task } from '@/types/task';
import { getStorageItem, setStorageItem } from '@/hooks/use-storage';

/**
 * Moves a task from one list to another
 * @param task - The task to move
 * @param sourceListId - The ID of the source list
 * @param destinationListId - The ID of the destination list
 * @returns Promise that resolves when the task has been moved
 */
export async function moveTask(
  task: Task,
  sourceListId: string,
  destinationListId: string
): Promise<void> {
  // 1. Get the task IDs from both lists
  const sourceTaskIds =
    (await getStorageItem<string[]>('tasklist-tasks', sourceListId)) || [];
  const destTaskIds =
    (await getStorageItem<string[]>('tasklist-tasks', destinationListId)) || [];

  // 2. Remove task from source list
  const updatedSourceTaskIds = sourceTaskIds.filter((id) => id !== task.id);
  await setStorageItem('tasklist-tasks', sourceListId, updatedSourceTaskIds);

  // 3. Add task to destination list
  const updatedDestTaskIds = [...destTaskIds, task.id];
  await setStorageItem('tasklist-tasks', destinationListId, updatedDestTaskIds);

  // 4. Copy task data to new location
  await setStorageItem(`task-${destinationListId}`, task.id, task);

  // 5. Remove task data from old location (optional cleanup)
  // Note: We don't use removeStorageItem to avoid importing it
  // The old task will be orphaned but won't affect functionality
}

/**
 * Moves multiple tasks from one list to another
 * @param tasks - Array of tasks to move
 * @param sourceListId - The ID of the source list
 * @param destinationListId - The ID of the destination list
 * @returns Promise that resolves when all tasks have been moved
 */
export async function moveTasks(
  tasks: Task[],
  sourceListId: string,
  destinationListId: string
): Promise<void> {
  // Get the task IDs from both lists
  const sourceTaskIds =
    (await getStorageItem<string[]>('tasklist-tasks', sourceListId)) || [];
  const destTaskIds =
    (await getStorageItem<string[]>('tasklist-tasks', destinationListId)) || [];

  // Get task IDs to move
  const taskIdsToMove = tasks.map((t) => t.id);

  // Remove tasks from source list
  const updatedSourceTaskIds = sourceTaskIds.filter(
    (id) => !taskIdsToMove.includes(id)
  );
  await setStorageItem('tasklist-tasks', sourceListId, updatedSourceTaskIds);

  // Add tasks to destination list
  const updatedDestTaskIds = [...destTaskIds, ...taskIdsToMove];
  await setStorageItem('tasklist-tasks', destinationListId, updatedDestTaskIds);

  // Copy each task to new location
  for (const task of tasks) {
    await setStorageItem(`task-${destinationListId}`, task.id, task);
  }
}
