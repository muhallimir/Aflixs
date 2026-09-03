import { useEffect, useState } from "react";

// Hand-rolled debounce hook (no new dependencies, React 17 safe).
// Returns a debounced copy of `value` that only updates after `delay` ms
// without further changes.
export default function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
