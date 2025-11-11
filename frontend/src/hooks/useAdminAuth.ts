import { useContext } from "react";
import { AdminAuthContext } from "@/contexts/AdminAuthContext";

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
