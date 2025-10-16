"use client";

import { useState, useCallback } from "react";
import { authAPI } from "@/lib/userAuth";
import { mutualLogout } from "@/lib/mutualLogout";

interface GoogleAuthState {
  isLoading: boolean;
  error: string | null;
}

interface GoogleAuthActions {
  googleSignin: (mode: "signin" | "signup") => Promise<{ success: boolean }>;
  clearError: () => void;
}

/**
 * Dynamically load Google Identity Services script
 */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("Not in browser");
    if (window.google) return resolve(); // already loaded

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load Google script");
    document.body.appendChild(script);
  });
}

export function useGoogleAuth(): GoogleAuthState & GoogleAuthActions {
  const [state, setState] = useState<GoogleAuthState>({
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const googleSignin = useCallback(async (mode: "signin" | "signup") => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await loadGoogleScript(); // ensure script is loaded

      // Wrap the callback in a Promise
      const result = await new Promise<{ success: boolean }>((resolve) => {
        window.google!.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: { credential: string }) => {
            try {
              const idToken = response.credential;

              if (!idToken) {
                throw new Error("No ID token returned from Google");
              }

              // Optional: clear existing admin sessions
              await mutualLogout.clearAdminSession();

              // Send JWT to backend
              const authResult = await authAPI.googleAuth({
                credential: idToken,
                mode,
              });

              if (!authResult.success) throw new Error("Authentication failed");

              setState((prev) => ({ ...prev, isLoading: false }));
              resolve({ success: true });
            } catch (error) {
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Google authentication failed",
              }));
              resolve({ success: false });
            }
          },
        });

        // Show the Google One Tap / button prompt
        window.google!.accounts.id.prompt();
      });

      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize Google authentication",
      }));
      return { success: false };
    }
  }, []);

  return {
    ...state,
    googleSignin,
    clearError,
  };
}

// Declare global types for Google OAuth
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}
