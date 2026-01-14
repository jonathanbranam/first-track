import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

import { Collapsible } from './collapsible';
import { ThemedText } from '@/components/themed-text';

describe('Collapsible', () => {
  const testTitle = 'Test Title';
  const testContent = 'Test Content';

  it('renders the title', () => {
    render(
      <Collapsible title={testTitle}>
        <ThemedText>{testContent}</ThemedText>
      </Collapsible>
    );

    expect(screen.getByText(testTitle)).toBeTruthy();
  });

  it('hides content by default when closed', () => {
    render(
      <Collapsible title={testTitle}>
        <ThemedText>{testContent}</ThemedText>
      </Collapsible>
    );

    expect(screen.queryByText(testContent)).toBeNull();
  });

  it('reveals content when opened', () => {
    render(
      <Collapsible title={testTitle}>
        <ThemedText>{testContent}</ThemedText>
      </Collapsible>
    );

    fireEvent.press(screen.getByText(testTitle));

    expect(screen.getByText(testContent)).toBeTruthy();
  });

  it('hides content when closed after being opened', () => {
    render(
      <Collapsible title={testTitle}>
        <ThemedText>{testContent}</ThemedText>
      </Collapsible>
    );

    // Open
    fireEvent.press(screen.getByText(testTitle));
    expect(screen.getByText(testContent)).toBeTruthy();

    // Close
    fireEvent.press(screen.getByText(testTitle));
    expect(screen.queryByText(testContent)).toBeNull();
  });

  it('toggles content visibility on multiple presses', () => {
    render(
      <Collapsible title={testTitle}>
        <ThemedText>{testContent}</ThemedText>
      </Collapsible>
    );

    // Initially closed
    expect(screen.queryByText(testContent)).toBeNull();

    // First press - open
    fireEvent.press(screen.getByText(testTitle));
    expect(screen.getByText(testContent)).toBeTruthy();

    // Second press - close
    fireEvent.press(screen.getByText(testTitle));
    expect(screen.queryByText(testContent)).toBeNull();

    // Third press - open again
    fireEvent.press(screen.getByText(testTitle));
    expect(screen.getByText(testContent)).toBeTruthy();
  });
});
