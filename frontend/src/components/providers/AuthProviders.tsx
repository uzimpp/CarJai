"use client";

import React from "react";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <UserAuthProvider>
        <ComparisonProvider>{children}</ComparisonProvider>
      </UserAuthProvider>
    </AdminAuthProvider>
  );
}
