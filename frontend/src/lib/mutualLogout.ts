// Mutual sign out utility to clear both user and admin sessions (pure cookie-based)
export const mutualLogout = {
  async clearAdminSession(): Promise<void> {
    try {
      // Pure cookie-based sign out - always attempt to clear backend session
      await fetch("/admin/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Silently ignore errors
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      // Pure cookie-based sign out - always attempt to clear backend session
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Silently ignore errors
    }
  },
};
