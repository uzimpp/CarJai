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
      // Debug logging
      console.log("NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
      console.log("Window google object:", window.google);
      
      // Initialize Google OAuth
      if (typeof window === "undefined" || !window.google) {
        throw new Error("Google OAuth not loaded");
      }

      // Wrap the token client callback into a promise to resolve on completion
      const result = await new Promise<{ success: boolean }>((resolve) => {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          scope: "openid profile email",
          callback: async (response: {
            access_token?: string;
            error?: string;
          }) => {
            try {
              if (response.error) {
                throw new Error(response.error);
              }

              // Clear any existing admin sessions
              await mutualLogout.clearAdminSession();

              // Send the credential to your backend
              const authResult = await authAPI.googleAuth({
                credential: response.access_token as string,
                mode,
              });

              if (!authResult.success) {
                throw new Error("Authentication failed");
              }

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

        // Request the token (this opens Google's UX flow)
        client.requestAccessToken();
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
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
