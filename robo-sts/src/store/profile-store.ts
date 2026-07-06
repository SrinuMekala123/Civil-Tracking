"use client";

import { create } from "zustand";
import pb from "@/lib/pocketbase";

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: string;
}

interface ProfileState {
  profile: ProfileData;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData> & { password?: string; oldPassword?: string }) => Promise<boolean>;
}

const DEFAULT_PROFILE: ProfileData = {
  name: "Admin User",
  email: "admin@civiltracking.gov.in",
  phone: "+91-9876543210",
  department: "Administration",
  role: "Super Admin",
  status: "Active",
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: DEFAULT_PROFILE,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    // Check localStorage first for instant load
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user_profile");
      if (cached) {
        try {
          set({ profile: JSON.parse(cached) });
        } catch (_) {}
      }
    }

    set({ isLoading: true, error: null });
    try {
      const authUser = pb.authStore.model;
      if (!authUser) {
        set({ isLoading: false });
        return;
      }

      // Fetch the latest user details from pocketbase users collection
      const record = await pb.collection("users").getOne(authUser.id);

      const updatedProfile: ProfileData = {
        name: record.name || "",
        email: record.email || "",
        phone: record.phone || "",
        department: record.department || "",
        role: record.role || "User",
        status: record.status || "Active",
      };

      set({ profile: updatedProfile, isLoading: false });

      if (typeof window !== "undefined") {
        localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
      }
    } catch (err) {
      console.warn("Failed to load profile from PocketBase, using defaults/cache:", err);
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const authUser = pb.authStore.model;
      if (!authUser) {
        throw new Error("No authenticated user session found");
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.password !== undefined) {
        updateData.password = data.password;
        updateData.passwordConfirm = data.password;
        if (data.oldPassword !== undefined) {
          updateData.oldPassword = data.oldPassword;
        }
      }

      // Update the user record directly in the system "users" collection
      const updatedRecord = await pb.collection("users").update(authUser.id, updateData);

      const newProfile: ProfileData = {
        name: updatedRecord.name || "",
        email: updatedRecord.email || "",
        phone: updatedRecord.phone || "",
        department: updatedRecord.department || "",
        role: updatedRecord.role || "User",
        status: updatedRecord.status || "Active",
      };

      // Sync with localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_profile", JSON.stringify(newProfile));
      }

      // Sync with useAuthStore state so sidebar, header, etc. update instantly
      const { useAuthStore } = await import("./auth-store");
      useAuthStore.setState({
        user: {
          id: updatedRecord.id,
          email: updatedRecord.email,
          name: updatedRecord.name || "",
          role: updatedRecord.role || "User",
          department: updatedRecord.department || "",
          phone: updatedRecord.phone || "",
          permissions: updatedRecord.permissions || [],
          status: updatedRecord.status || "Active",
        },
      });

      set({ profile: newProfile, isLoading: false });

      // Log activity
      try {
        await pb.collection("activity_logs").create({
          user_id: updatedRecord.id,
          user_name: updatedRecord.name || updatedRecord.email,
          action: "updated",
          resource_type: "user",
          details: `Updated personal profile settings`,
          ip_address: "127.0.0.1",
          user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "Server",
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Failed to log profile update activity:", e);
      }

      // Create notification
      try {
        await pb.collection("notifications").create({
          title: "Profile Updated",
          message: "Your profile details have been successfully updated.",
          time: new Date().toISOString(),
          read: false,
          type: "success",
        });
      } catch (e) {
        console.error("Failed to create profile update notification:", e);
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      console.error("Failed to update profile:", err);
      set({ error: msg, isLoading: false });
      return false;
    }
  },
}));
