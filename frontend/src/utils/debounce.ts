/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void | Promise<void>,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: TArgs) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default debounce;
