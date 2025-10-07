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
      if (typeof window === "undefined" || !window.google) {
        throw new Error("Google OAuth not loaded");
      }

      // Wrap the callback in a Promise
      const result = await new Promise<{ success: boolean }>((resolve) => {
        window.google!.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: { credential: string }) => {
            try {
              const idToken = response.credential; // ✅ This is the JWT

              if (!idToken) {
                throw new Error("No ID token returned from Google");
              }

              // Optional: clear existing admin sessions
              await mutualLogout.clearAdminSession();

              // Send JWT to your backend
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
