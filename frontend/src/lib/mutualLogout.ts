// Mutual sign out utility to clear both user and admin sessions
import { adminAPI } from "./adminAPI";
import { authAPI } from "./userAuth";

export const mutualLogout = {
  async clearAdminSession(): Promise<void> {
    try {
      // Use existing adminAPI function for consistency
      await adminAPI.clearAdminSession();
    } catch {
      // Silently ignore errors
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      // Use existing authAPI function for consistency
      await authAPI.clearUserSession();
    } catch {
      // Silently ignore errors
    }
  },
};
