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

### Section 11.3: Timer Screen Redesign

#### Added
- **ActivityInstanceModal Component**: Modal for creating/editing activity instances
  - Title and description input fields
  - Activity type selector with inline type creation
  - "Start timer immediately" checkbox for new instances
  - On-the-fly activity type creation with color palette picker
- **ActivityInstanceItem Component**: Display component for activity instances
  - Shows title, description, type color, and status (Active/Paused/Completed/Ready)
  - Displays timer for active instances
  - Shows accumulated duration for paused instances
  - Completion checkmark for completed instances
  - Action buttons: Start/Resume, Pause, Complete, Restart, Edit, Delete
- **calculateAccumulatedDuration Utility**: Calculates total duration excluding paused time

#### Changed
- **Timer Screen**: Completely redesigned to use activity instances
  - Removed activity picker dropdown - activities now created inline
  - Displays list of all current day instances (incomplete + same-day completed)
  - Sorted by completion status (incomplete first) and lastActiveAt (descending)
  - "New Activity" button opens ActivityInstanceModal
  - Each instance shown with ActivityInstanceItem component
  - Auto-pause current instance when starting/resuming another
- **useActivitySession Hook**: Enhanced to update instance lastActiveAt timestamps
  - `startActivity()` now updates lastActiveAt on the instance
  - `pauseActivity()` updates lastActiveAt on pause
  - `resumeActivity()` updates lastActiveAt on resume
  - Added optional `shouldUpdateLastActive` parameter to startActivity

#### Removed
- Activity picker modal from timer screen (replaced with inline creation)
- Switch activity feature (replaced with direct start/resume on instances)
- Activity stack display (replaced with inline instance list)

#### Testing
- Added comprehensive test suite: `timer-screen-redesign.test.tsx`
  - 500+ lines of tests covering all new functionality
  - Empty state and initial creation (2 tests)
  - Activity instance display and sorting (5 tests)
  - Creating new instances with on-the-fly type creation (3 tests)
  - Starting, pausing, and resuming instances (4 tests)
  - Auto-pause when switching activities (1 test)
  - Completing and restarting instances (4 tests)
  - Editing and deleting instances (3 tests)
  - Active timer display and status (2 tests)
  - Day boundary logic for completed instances (1 test)

#### Documentation
- Updated CLAUDE.md components section with new activity components
- Updated CLAUDE.md data layer with calculateAccumulatedDuration utility
- Updated CLAUDE.md tests section with new test file
- Added "Timer Screen Workflow" section to CLAUDE.md working with data guidelines
