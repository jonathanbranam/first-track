import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo import.meta and winter runtime
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Mock structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock react-native-draggable-flatlist
jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = require('react-native');
  const React = require('react');

  return {
    __esModule: true,
    default: ({ data, renderItem, keyExtractor, onDragEnd, ...props }: any) => {
      return React.createElement(FlatList, {
        ...props,
        data,
        renderItem: ({ item, index }: any) => renderItem({
          item,
          getIndex: () => index,
          drag: jest.fn(),
          isActive: false,
        }),
        keyExtractor,
        testID: 'draggable-flatlist',
      });
    },
    ScaleDecorator: ({ children }: any) => children,
  };
});
