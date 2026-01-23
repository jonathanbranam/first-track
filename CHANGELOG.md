# Changelog

## [Unreleased] - 2026-01-23

### Section 11.2: Activity Instance System

#### Added
- **ActivityInstance Interface**: New data model for individual activity instances
  - `title` field for free-text naming
  - `description` field for optional details
  - `typeId` field to reference ActivityType
  - `completed` and `completedAt` fields for lifecycle management
  - `lastActiveAt` field for sorting by recency
- **useActivityInstances Hook**: New hook for managing activity instances
  - CRUD operations: `createInstance`, `updateInstance`, `deleteInstance`
  - Lifecycle operations: `completeInstance`, `uncompleteInstance`, `restartInstance`
  - Filtering: `currentDayInstances` (incomplete + same-day completed)
  - Sorting: `sortedInstances` (by status and lastActiveAt)
  - Touch operation: `touchInstance` to update lastActiveAt
- **4am Day Boundary Logic**: Days start at 4am instead of midnight
  - `getCurrentDayBoundary()` utility function
  - `isCurrentDay()` check for timestamp validation
  - Completed activities only visible on completion day

#### Changed
- **Storage Keys**: New keys for activity instances
  - `activity-instances-all` → stores instance IDs
  - `activity-instance-{id}` → stores individual instances
- **ActivityLog**: Now references ActivityInstance.id (documented in comments)

#### Deprecated
- **Activity Interface**: Marked as deprecated, use ActivityInstance instead
- **useActivities Hook**: Use useActivityInstances instead

#### Testing
- Added 61 comprehensive unit tests for ActivityInstance system
  - CRUD operations (5 tests)
  - Complete/uncomplete/restart lifecycle (5 tests)
  - Touch and lastActiveAt updates (1 test)
  - Sorting and filtering (2 tests)
  - Persistence across remounts (1 test)
  - Day boundary utilities (4 tests)
- All tests passing with 97.99% code coverage on use-activities.ts

#### Documentation
- Updated CLAUDE.md with ActivityInstance architecture
- Added 4am day boundary pattern to key patterns
- Updated data storage architecture section
- Updated working with data guidelines
