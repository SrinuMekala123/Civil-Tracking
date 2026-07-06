"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import pb from "@/lib/pocketbase";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  permissions: string[];
  status?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Authenticate with PocketBase users collection
          const authData = await pb.collection("users").authWithPassword(
            email.trim().toLowerCase(),
            password
          );

          if (authData.record && authData.token) {
            const user: User = {
              id: authData.record.id,
              email: authData.record.email,
              name: authData.record.name || "",
              role: authData.record.role || "User",
              department: authData.record.department || "",
              phone: authData.record.phone || "",
              permissions: authData.record.permissions || [],
              status: authData.record.status || "Active",
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Save token to localStorage
            localStorage.setItem("pb_auth", authData.token);

            // Sync with local profile-store cache
            localStorage.setItem("user_profile", JSON.stringify({
              name: user.name,
              email: user.email,
              phone: user.phone,
              department: user.department,
              role: user.role,
              status: user.status,
            }));

            // Log activity log
            try {
              await pb.collection("activity_logs").create({
                user_id: user.id,
                user_name: user.name || user.email,
                action: "login",
                resource_type: "auth",
                details: `User ${user.name || user.email} logged in successfully`,
                ip_address: "127.0.0.1",
                user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "Server",
                timestamp: new Date().toISOString(),
              });
            } catch (_) {}

            return true;
          }

          set({ isLoading: false, error: "Invalid credentials" });
          return false;
        } catch (error: any) {
          console.error("Login failed:", error);
          set({
            isLoading: false,
            error: error.message || "Login failed. Please try again.",
          });
          return false;
        }
      },

      logout: () => {
        const currentUser = get().user;
        if (currentUser) {
          try {
            pb.collection("activity_logs").create({
              user_id: currentUser.id,
              user_name: currentUser.name || currentUser.email,
              action: "logout",
              resource_type: "auth",
              details: `User ${currentUser.name || currentUser.email} logged out successfully`,
              ip_address: "127.0.0.1",
              user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "Server",
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Failed to log logout activity:", e);
          }
        }

        pb.authStore.clear();
        if (typeof window !== "undefined") {
          localStorage.removeItem("pb_auth");
          localStorage.removeItem("user_profile");
        }
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: () => {
        if (pb.authStore.isValid && pb.authStore.token) {
          const userRecord = pb.authStore.model as any;
          if (userRecord) {
            set({
              user: {
                id: userRecord.id,
                email: userRecord.email,
                name: userRecord.name || "",
                role: userRecord.role || "User",
                department: userRecord.department || "",
                phone: userRecord.phone || "",
                permissions: userRecord.permissions || [],
                status: userRecord.status || "Active",
              },
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
