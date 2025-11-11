/**
 * Get formatted time remaining until a date
 * @param expiresAt - ISO date string
 * @returns Formatted string like "2 hours 30 minutes" or "Expired"
 */
export function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hours ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
}

/**
 * Check if a session is expiring soon
 * @param expiresAt - ISO date string
 * @param thresholdMinutes - Minutes before expiry to consider "soon" (default: 30)
 * @returns true if expiring within threshold, false otherwise
 */
export function isSessionExpiringSoon(
  expiresAt: string,
  thresholdMinutes: number = 30
): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return diff <= thresholdMinutes * 60 * 1000;
}

/**
 * Get the difference in milliseconds between now and a date
 * @param date - ISO date string
 * @returns Time difference in milliseconds (negative if past)
 */
export function getTimeDifference(date: string): number {
  const now = new Date();
  const target = new Date(date);
  return target.getTime() - now.getTime();
}
