import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay`ms of no
 * changes. Used to throttle search-as-you-type so we hit the API once the user
 * pauses, not on every keystroke.
 */
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
