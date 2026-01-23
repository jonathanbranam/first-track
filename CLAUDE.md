# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web
npm run lint           # Run ESLint
npm test               # Run all tests
npm test -- --watch    # Run tests in watch mode
npm test -- tasks.test # Run specific test file
```

**Note for Claude Web Environment:** Before running tests, you must first run `npm install` to ensure all dependencies (including Jest) are installed in the node_modules directory.

## Architecture

This is a React Native mobile app built with Expo (v54) and TypeScript, targeting iOS, Android, and web platforms.

### App Features
The design and specification for app features are documented in `app-feature-list.md` at the repository root. **Always reference this file when implementing new features** to ensure consistency with the intended design and functionality.

### Tech Stack
- **Framework:** Expo with Expo Router (file-based routing)
- **Language:** TypeScript with strict mode
- **Navigation:** Tab-based navigation using @react-navigation/bottom-tabs
- **Testing:** Jest with jest-expo preset and @testing-library/react-native

### Project Structure

#### Application Screens (`app/`)
File-based routing with Expo Router:
- `app/_layout.tsx` - Root layout (ThemeProvider, GestureHandler, QuickLogProvider)
- `app/(tabs)/_layout.tsx` - Tab navigation with 6 tabs
- `app/(tabs)/index.tsx` - **Tasks Screen** (main) - drag-and-drop task list with bulk operations
- `app/(tabs)/task-lists.tsx` - **Task Lists Screen** - manage lists with emoji/color pickers
- `app/(tabs)/timer.tsx` - **Timer Screen** - activity instance list with inline creation, start/pause/complete actions
- `app/(tabs)/behaviors.tsx` - **Behaviors Screen** - behavior tracking and logging
- `app/(tabs)/reflect.tsx` - **Reflect Screen** - daily reflection with 0-10 rating scale
- `app/(tabs)/settings.tsx` - **Settings Screen**
- `app/modal.tsx` - Modal screen for overlays

#### Components (`components/`)
Organized by feature:
- `components/tasks/` - Task management UI
  - `task-item.tsx` - Draggable, swipeable task item
  - `task-modal.tsx` - Create/edit task modal
  - `task-detail-modal.tsx` - View/edit task details
  - `task-list-dropdown.tsx` - List selector dropdown
  - `task-list-picker-modal.tsx` - Move tasks between lists
  - `empty-state.tsx` - Empty list placeholder
- `components/task-list/` - Task list management
  - `task-list-item.tsx` - List item with emoji/color
  - `task-list-modal.tsx` - Create/edit list modal
  - `color-picker.tsx` - Color palette selector
  - `emoji-picker.tsx` - Emoji selector
- `components/behaviors/` - Behavior tracking
  - `quick-log-fab.tsx` - Floating action button
  - `quick-log-modal.tsx` - Global quick-log modal
- `components/activities/` - Activity instance management
  - `activity-instance-modal.tsx` - Create/edit activity instance with type selection and inline type creation
  - `activity-instance-item.tsx` - Display activity instance with timer, status, and action buttons
- `components/ui/` - Core reusable UI
  - `rating-scale.tsx` - 0-10 rating buttons for reflections
  - `icon-symbol.tsx` - Icon component with symbol mapping
  - `icon-symbol.ios.tsx` - iOS-specific icon implementation
  - `collapsible.tsx` - Expandable content sections
- `components/` - Other shared components
  - `timer-display.tsx` - HH:MM:SS timer with pause handling
  - `activity-picker.tsx` - Activity selection dropdown
  - `themed-view.tsx` - Theme-aware View wrapper
  - `themed-text.tsx` - Theme-aware Text wrapper
  - `haptic-tab.tsx` - Tab with haptic feedback
  - `parallax-scroll-view.tsx` - Scrollable parallax header

#### Data Layer (`hooks/`)
Custom hooks for state and data management:
- `use-storage.ts` - **Core data persistence** - AsyncStorage wrapper with CRUD operations
- `use-activities.ts` - Activity type and activity instance management (CRUD, timer session state)
  - `useActivityTypes()` - Manage activity type categories (Work, Exercise, etc.)
  - `useActivities()` - [DEPRECATED] Legacy activity management - use useActivityInstances instead
  - `useActivityInstances()` - Manage individual activity instances with complete/restart lifecycle
  - `useActivityLogs()` - Manage activity session logs
  - `useActivitySession()` - Manage current timer state, updates lastActiveAt on start/pause/resume
  - `getCurrentDayBoundary()` - Utility for 4am day boundary calculation
  - `isCurrentDay()` - Check if timestamp is from current day (4am boundary)
  - `calculateAccumulatedDuration()` - Calculate accumulated duration for activity logs (excluding paused time)
- `use-behaviors.ts` - Behavior and log management (CRUD, stats calculation)
- `use-reflections.ts` - Reflection questions and responses (CRUD, daily tracking)
- `use-color-scheme.ts` - Light/dark mode detection (platform-specific)
- `use-color-scheme.web.ts` - Web-specific color scheme detection
- `use-theme-color.ts` - Dynamic theme colors

#### Type Definitions (`types/`)
TypeScript interfaces for all data models:
- `task.ts` - `Task` interface (id, description, notes, completed, deletedAt)
- `task-list.ts` - `TaskList` interface (id, name, emoji, color, listType)
- `behavior.ts` - `Behavior`, `BehaviorLog`, `BehaviorStats` (type: reps/duration/weight/count)
- `activity.ts` - `ActivityType`, `Activity`, `ActivityInstance`, `ActivityLog`, `ActivitySession`
  - `ActivityType` - Configurable activity categories (name, color, active status)
  - `Activity` - [DEPRECATED] Legacy activity interface - use ActivityInstance instead
  - `ActivityInstance` - Individual activity instances with title, description, typeId, completed status, and lastActiveAt
  - `ActivityLog` - Timer session data with pause intervals (references ActivityInstance)
  - `ActivitySession` - Current timer state
- `reflection.ts` - `ReflectionQuestion`, `ReflectionResponse`, `ReflectionStats`

#### Context Providers (`contexts/`)
- `quick-log-context.tsx` - Global state for quick-log modal visibility (wraps entire app)

#### Utilities (`utils/`)
- `task-operations.ts` - Task manipulation functions (moveTask, moveTasks, deleteTasks, setTasksCompleted)

#### Tests (`__tests__/`)
Comprehensive test coverage:
- `tasks.test.tsx` (2,341 lines) - Task screen integration tests
- `task-lists.test.tsx` (686 lines) - List management tests
- `activities.test.tsx` (1,070 lines) - Activity types, activities, logs, and session tests (39 tests, 97% coverage)
- `behaviors.test.tsx` (707 lines) - Behavior and log management tests
- `reflections.test.tsx` (734 lines) - Reflection Q&A tests
- `timer-display.test.tsx`, `timer-screen.test.tsx` - Timer component tests (legacy)
- `timer-screen-redesign.test.tsx` (500+ lines) - Comprehensive tests for redesigned timer screen (Section 11.3)
- `activity-picker.test.tsx`, `behavior-screen.test.tsx` - Component tests
- `jest.setup.ts` - Test configuration (mocks AsyncStorage, Expo, draggable-flatlist)

#### Configuration
- `constants/theme.ts` - Color and font definitions for light/dark modes
- `package.json` - Dependencies (Expo 54, React 19, React Native 0.81)
- `tsconfig.json` - TypeScript config with `@/*` path alias
- `jest.config.ts` - Jest with jest-expo preset
- `app.json` - Expo app configuration
- `eas.json` - EAS Build configuration
- `eslint.config.js` - ESLint rules

### Data Storage Architecture

**AsyncStorage Key Structure:**
```
tasklists-all → string[] (list IDs)
tasklist-{listId} → TaskList
tasklist-tasks-{listId} → string[] (task IDs)
task-{listId}-{taskId} → Task

behaviors-all → string[] (behavior IDs)
behavior-{id} → Behavior
behavior-logs-all → string[] (log IDs)
behavior-log-{id} → BehaviorLog

activity-types-all → string[] (activity type IDs)
activity-type-{id} → ActivityType
activities-all → string[] (activity IDs) [DEPRECATED]
activity-{id} → Activity [DEPRECATED]
activity-instances-all → string[] (activity instance IDs)
activity-instance-{id} → ActivityInstance
activity-logs-all → string[] (log IDs)
activity-log-{id} → ActivityLog
activity-session-current → ActivitySession

reflection-questions-all → string[] (question IDs)
reflection-question-{id} → ReflectionQuestion
reflection-responses-{questionId}-{date} → ReflectionResponse[]
```

**Storage Pattern:**
- All entities use ID-based references
- Collections stored as ID arrays (`*-all` keys)
- Individual entities stored with prefixed IDs
- Soft deletes via `deletedAt` timestamp (tasks)
- Daily tracking uses midnight timestamps (reflections)
- Activity instances use 4am day boundary (days start at 4am, not midnight)

### Key Patterns
- **Theming:** Dual theme support (light/dark) with automatic system preference detection. Use `useThemeColor` hook for dynamic colors.
- **State Management:** Local component state with React hooks. Global state via QuickLogContext for quick-log modal only.
- **Data Persistence:** `useStorage<T>` hook wraps AsyncStorage for all CRUD operations. Always use this instead of direct AsyncStorage calls.
- **Path Aliases:** Use `@/*` to import from project root (configured in tsconfig.json).
- **Platform-specific code:** Use `.ios.tsx` suffix for iOS-specific component implementations.
- **IconSymbol Mapping:** Icon symbols must be added to the mapping in components/ui/icon-symbol.tsx when used.
- **Soft Deletes:** Tasks use `deletedAt` timestamp instead of hard delete to preserve data integrity.
- **ID-Based Architecture:** All entities reference each other by ID strings for flexibility.
- **Timestamp-Based Dates:** Reflection responses use midnight timestamps for daily tracking.
- **4am Day Boundary:** Activity instances use 4am as the day boundary (getCurrentDayBoundary() utility). Completed activities only show on the same "day" they were completed, where a day starts at 4am instead of midnight. Use isCurrentDay() to check if a timestamp is from the current day.
- **Gesture Handling:** Swipeable components for task actions, DraggableFlatList for reordering.

## Common Workflows

### Adding a New Feature
1. Check `app-feature-list.md` for feature specifications
2. Define TypeScript interfaces in `types/` if new data models are needed
3. Create custom hook in `hooks/` for data management (using `useStorage<T>`)
4. Build UI components in `components/[feature-name]/`
5. Create screen in `app/(tabs)/` and add to tab navigation if needed
6. Write comprehensive tests in `__tests__/`
7. Update this file (CLAUDE.md) if architectural patterns change

### Working with Data
- **Reading data:** Use appropriate custom hook (e.g., `useBehaviors()`, `useActivityInstances()`, `useActivityTypes()`)
- **Writing data:** Hooks provide `create`, `update`, `delete` methods (or `add`/`remove` for older hooks)
- **Direct storage access:** Only use `useStorage<T>` for new data types
- **Never use AsyncStorage directly** - always go through hooks
- **Activity instances:** Use `useActivityInstances()` for activity instance management (not deprecated `useActivities()`)
  - `currentDayInstances` - filtered list of incomplete + same-day completed instances
  - `sortedInstances` - sorted by completion status and lastActiveAt
  - `completeInstance()`, `restartInstance()` - lifecycle operations
- **Timer Screen Workflow:**
  - Activity instances are created inline on the timer screen (not in settings)
  - Each instance has a title, optional description, and references an ActivityType
  - Instances can be in one of three states: active (timer running), paused, or completed
  - The timer screen displays all incomplete instances and same-day completed instances
  - Sorting: incomplete instances first, then by most recently active (lastActiveAt descending)
  - Auto-pause: starting a new instance automatically pauses the current active instance
  - Complete/Restart: completed instances can only be restarted on the same day (4am boundary)
  - Activity types can be created on-the-fly during instance creation

### Adding New Icons
1. Find SF Symbol name from Apple's SF Symbols app or web resources
2. Add mapping to `components/ui/icon-symbol.tsx` in `ICON_MAPPING` object
3. For iOS-specific icons, add to `components/ui/icon-symbol.ios.tsx`
4. Use in components: `<IconSymbol name="your-symbol-name" />`

### Testing Best Practices
- Run `npm install` first in web environment before tests
- Mock AsyncStorage is configured in `jest.setup.ts`
- Use React Testing Library queries (`getByText`, `getByTestId`, etc.)
- Test user interactions with `fireEvent.press()`, `fireEvent.changeText()`
- For async operations, use `waitFor()` or `findBy*` queries
- Test both light and dark theme variants where applicable

### Debugging Storage Issues
1. Check AsyncStorage keys in `__tests__/*.test.tsx` for expected structure
2. Use `console.log()` in hooks to trace data flow
3. Clear AsyncStorage in tests with `AsyncStorage.clear()` in `beforeEach`
4. Verify ID generation (uses `Date.now().toString()` pattern)

### Code Style
- Use TypeScript strict mode (no `any` types)
- Prefer functional components with hooks over class components
- Use `ThemedView` and `ThemedText` for theme-aware components
- Follow existing naming conventions (e.g., `use-kebab-case.ts` for hooks)
- Export interfaces from `types/` files, import with `import type { ... }`
