import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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

// Mock react-native-swipeable-item
jest.mock('react-native-swipeable-item', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef(({ children, renderUnderlayRight, item }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        close: jest.fn(),
        open: jest.fn(),
      }));

      const underlay = renderUnderlayRight?.();
      return React.createElement(View, { testID: `swipeable-${item.id}` }, [
        underlay ? React.cloneElement(underlay, { key: 'underlay' }) : null,
        React.cloneElement(children, { key: 'content' }),
      ]);
    }),
    OpenDirection: { LEFT: 'left', RIGHT: 'right' },
  };
});
