import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface RatingScaleProps {
  value: number | null;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function RatingScale({
  value,
  onValueChange,
  min = 0,
  max = 10,
  disabled = false
}: RatingScaleProps) {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'tabIconDefault');

  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <View style={styles.container}>
      <View style={styles.scaleContainer}>
        {numbers.map((num) => {
          const isSelected = value === num;
          return (
            <TouchableOpacity
              key={num}
              style={[
                styles.numberButton,
                {
                  borderColor: isSelected ? primaryColor : borderColor,
                  backgroundColor: isSelected ? primaryColor : backgroundColor,
                },
                disabled && styles.disabled,
              ]}
              onPress={() => !disabled && onValueChange(num)}
              disabled={disabled}
              accessibilityLabel={`Rating ${num}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
            >
              <Text
                style={[
                  styles.numberText,
                  {
                    color: isSelected ? '#FFFFFF' : textColor,
                  },
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.labelsContainer}>
        <Text style={[styles.labelText, { color: textColor }]}>Low</Text>
        <Text style={[styles.labelText, { color: textColor }]}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberButton: {
    width: 32,
    height: 40,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 12,
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
});
