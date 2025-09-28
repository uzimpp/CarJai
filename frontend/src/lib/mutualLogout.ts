// Mutual logout utility to clear both user and admin sessions (pure cookie-based)
export const mutualLogout = {
  async clearAdminSession(): Promise<void> {
    try {
      // Pure cookie-based logout - always attempt to clear backend session
      await fetch("/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("🧹 Cleared admin session (cookie-based)");
    } catch (err) {
      console.log("ℹ️ Error clearing admin session:", err);
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      // Pure cookie-based logout - always attempt to clear backend session
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("🧹 Cleared user session (cookie-based)");
    } catch (err) {
      console.log("ℹ️ Error clearing user session:", err);
    }
  },
};
