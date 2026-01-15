import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function buildKey(label: string, key: string): string {
  return `${label}-${key}`;
}

export function useStorage<T>(label: string, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const compositeKey = buildKey(label, key);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const stored = await AsyncStorage.getItem(compositeKey);
        if (mounted) {
          setData(stored ? JSON.parse(stored) : null);
        }
      } catch (error) {
        console.error('Failed to load from storage:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [compositeKey]);

  const save = useCallback(
    async (value: T) => {
      try {
        await AsyncStorage.setItem(compositeKey, JSON.stringify(value));
        setData(value);
      } catch (error) {
        console.error('Failed to save to storage:', error);
        throw error;
      }
    },
    [compositeKey]
  );

  const remove = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(compositeKey);
      setData(null);
    } catch (error) {
      console.error('Failed to remove from storage:', error);
      throw error;
    }
  }, [compositeKey]);

  return { data, loading, save, remove };
}

export async function getStorageItem<T>(label: string, key: string): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(buildKey(label, key));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get from storage:', error);
    return null;
  }
}

export async function setStorageItem<T>(label: string, key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(buildKey(label, key), JSON.stringify(value));
}

export async function removeStorageItem(label: string, key: string): Promise<void> {
  await AsyncStorage.removeItem(buildKey(label, key));
}
