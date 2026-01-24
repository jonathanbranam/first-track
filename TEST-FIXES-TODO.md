# Test Fixes - Work in Progress

## Status Summary
- **Started:** Fixing lint, TypeScript, and test errors
- **Tests Fixed:** 3 of 5 failing test suites
- **Tests Remaining:** 2 test suites need fixes

## Completed Fixes

### 1. behavior-settings.test.tsx ✅
- Updated mock from `useActivities` to `useActivityTypes` (the component now uses `useActivityTypes`)
- Added mocks for `useReflectionQuestions`, `useColorScheme`, and `react-native-safe-area-context`
- Removed `active: true` from `createBehavior` expectation (type signature changed to auto-set `active`)
- Added `testID` to delete button in `settings.tsx` for reliable test selection

### 2. timer-screen-redesign.test.tsx ✅
- Fixed mock for `@/hooks/use-activities` to include all exported functions:
  - `useActivityInstances`, `useActivityTypes`, `useActivitySession`, `useActivityLogs`
  - `calculateAccumulatedDuration`, `isCurrentDay`, `getCurrentDayBoundary`
- Added mocks for `useThemeColor` and `useColorScheme`
- Fixed `isCurrentDay` mock to actually check timestamps (for day boundary tests)
- Updated tests to use `getAllByText` when multiple matching elements exist
- Changed `getByText` to `getByPlaceholderText` for input placeholders
- Fixed `activity-instance-modal.tsx` to handle missing event in tests: `e?.stopPropagation?.()`

### 3. tasks.test.tsx ✅
- Added `useRouter` mock to existing `expo-router` mock
- Added mocks for `useColorScheme` and `useReflectionQuestions`/`useReflectionResponses`

## Remaining Test Suites to Fix

### 4. task-lists.test.tsx
**Error:** `useStorage is not a function`
**Likely Fix:** Add mock for `@/hooks/use-storage` or check how it's being imported

### 5. behavior-screen.test.tsx
**Error:** `useBehaviorLogs is not a function`
**Likely Fix:** Add mock for `useBehaviorLogs` from `@/hooks/use-behaviors`

## Key Learnings & Patterns

### Mock Patterns for This Codebase

1. **Hook Mocks** - When mocking hooks, include ALL exported functions from the module:
```typescript
jest.mock('@/hooks/use-activities', () => ({
  useActivityInstances: jest.fn(),
  useActivityTypes: jest.fn(),
  useActivitySession: jest.fn(),
  useActivityLogs: jest.fn(),
  calculateAccumulatedDuration: jest.fn((log) => log?.duration || 0),
  isCurrentDay: jest.fn(() => true),
  getCurrentDayBoundary: jest.fn(() => Date.now() - 4 * 60 * 60 * 1000),
}));
```

2. **Common Mocks Needed:**
```typescript
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));
```

3. **Multiple Elements with Same Text** - Use `getAllByText` instead of `getByText`:
```typescript
// Bad - throws if multiple matches
const button = getByText('New Activity');

// Good - handles multiple matches
const buttons = getAllByText('New Activity');
fireEvent.press(buttons[0]);
```

4. **Placeholder Text vs Display Text** - Use correct query:
```typescript
// For placeholder attribute
getByPlaceholderText('Activity title (required)')

// For visible text
getByText('Submit')
```

5. **Event Handler Safety** - Make event handlers defensive for tests:
```typescript
// Bad - crashes in tests
onPress={(e) => e.stopPropagation()}

// Good - works in tests
onPress={(e) => e?.stopPropagation?.()}
```

## Commands to Run

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tasks.test.tsx

# Run lint and TypeScript checks
npm run lint && npx tsc --noEmit
```

## Files Modified in This Session

- `__tests__/behavior-settings.test.tsx` - Updated mocks
- `__tests__/timer-screen-redesign.test.tsx` - Updated mocks and test assertions
- `__tests__/tasks.test.tsx` - Added missing mocks
- `app/(tabs)/settings.tsx` - Added testID for delete behavior button
- `components/activities/activity-instance-modal.tsx` - Made event handler defensive
