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

## Architecture

This is a React Native mobile app built with Expo (v54) and TypeScript, targeting iOS, Android, and web platforms.

### Tech Stack
- **Framework:** Expo with Expo Router (file-based routing)
- **Language:** TypeScript with strict mode
- **Navigation:** Tab-based navigation using @react-navigation/bottom-tabs
- **Testing:** Jest with jest-expo preset and @testing-library/react-native

### Project Structure
- `app/` - Application routes using Expo Router's file-based routing
  - `(tabs)/` - Tab navigation group containing main screens (index, explore, tasks)
  - `_layout.tsx` files define navigation structure
- `components/` - Reusable UI components with themed variants
- `hooks/` - Custom React hooks (useColorScheme, useThemeColor)
- `constants/theme.ts` - Color and font definitions for light/dark modes
- `__tests__/` - Jest test files

### Key Patterns
- **Theming:** Dual theme support (light/dark) with automatic system preference detection. Use `useThemeColor` hook for dynamic colors.
- **State Management:** Local component state with React hooks. No global state library.
- **Path Aliases:** Use `@/*` to import from project root (configured in tsconfig.json).
- **Platform-specific code:** Use `.ios.tsx` suffix for iOS-specific component implementations.
- **IconSymbol Mapping:** Icon symbols must be added to the mapping in components/ui/icon-symbol.tsx when used.
