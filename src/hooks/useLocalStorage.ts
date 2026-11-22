import { useCallback, useState } from 'react';

function readStoredOrInit<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === '') {
      window.localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    }
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
      window.localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    }
    return parsed;
  } catch {
    try {
      window.localStorage.setItem(key, JSON.stringify(initialValue));
    } catch {
      // Ignore storage quota errors
    }
    return initialValue;
  }
}

/**
 * Persists React state into window.localStorage and seeds initialValue when empty.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readStoredOrInit(key, initialValue),
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
          // Ignore storage quota errors
        }
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
