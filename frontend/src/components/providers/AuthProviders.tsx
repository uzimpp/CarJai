"use client";

import React from "react";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <UserAuthProvider>{children}</UserAuthProvider>
    </AdminAuthProvider>
  );
}
