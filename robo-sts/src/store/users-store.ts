"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { User } from "@/types";
import { createUpdateLog } from "@/lib/logging-utils";

interface UsersState {
    users: User[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;

    fetchUsers: (filters?: {
        role?: string;
        department?: string;
        status?: string;
        search?: string;
    }) => Promise<void>;
    addUser: (user: Partial<User>) => Promise<void>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
    users: [],
    isLoading: false,
    error: null,
    totalCount: 0,

    fetchUsers: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const parts: string[] = [];
            if (filters?.role && filters.role !== "all") {
                parts.push(`role = "${filters.role}"`);
            }
            if (filters?.department && filters.department !== "all") {
                parts.push(`department~"${filters.department}"`);
            }
            if (filters?.status && filters.status !== "all") {
                parts.push(`status = "${filters.status}"`);
            }
            if (filters?.search) {
                const q = filters.search;
                parts.push(`(name~"${q}" || email~"${q}" || department~"${q}")`);
            }
            const filter = parts.length ? parts.join(" && ") : undefined;

            const result = await pb.collection("users").getFullList({
                sort: "-created",
                filter,
            });

            const mappedUsers: User[] = result.map((record) => ({
                id: record.id,
                name: record.name || "",
                email: record.email || "",
                role: record.role as "Super Admin" | "Admin" | "Officer" | "Viewer" || "Viewer",
                permissions: Array.isArray(record.permissions) ? record.permissions : [],
                department: record.department || "",
                phone: record.phone || "",
                status: record.status as "Active" | "Inactive" | "Suspended" || "Active",
                last_login: record.last_login || "",
                created: record.created,
                updated: record.updated,
            }));

            set({
                users: mappedUsers,
                totalCount: mappedUsers.length,
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load users";
            console.error("Failed to fetch users:", error);
            set({ error: message, isLoading: false });
        }
    },

    addUser: async (userData) => {
        try {
            const payload = {
                ...userData,
                emailVisibility: true,
                verified: true,
                password: (userData as any).password || "12345678",
                passwordConfirm: (userData as any).password || "12345678",
            };
            await pb.collection("users").create(payload);
            try {
                await pb.collection("notifications").create({
                    title: "New User Registered",
                    message: `Added user: ${userData.name} (${userData.email || 'N/A'}) with role ${userData.role || 'Viewer'}`,
                    time: new Date().toISOString(),
                    read: false,
                    type: "success"
                });
            } catch (e) {
                console.error("Failed to add notification for new user:", e);
            }
            try {
                await createUpdateLog({
                    officer_name: userData.name || "N/A",
                    update_type: "User Registered",
                    description: `Registered system user: ${userData.name} (${userData.email || 'N/A'}) with role ${userData.role || 'Viewer'}`,
                    new_value: `Role: ${userData.role || 'Viewer'}, Department: ${userData.department || 'N/A'}`,
                    priority: "Low"
                });
            } catch (e) {
                console.error("Failed to log addUser to update_logs:", e);
            }
            await get().fetchUsers();
        } catch (error) {
            console.error("Failed to add user:", error);
            throw error;
        }
    },

    updateUser: async (id, data) => {
        try {
            const oldUser = get().users.find((u) => u.id === id);
            await pb.collection("users").update(id, data);
            if (oldUser) {
                const changes: string[] = [];
                for (const [key, value] of Object.entries(data)) {
                    if (key === "updated" || key === "id" || key === "created" || key === "permissions") continue;
                    const oldVal = (oldUser as any)[key];
                    const oldStr = Array.isArray(oldVal) ? oldVal.join(", ") : String(oldVal !== undefined && oldVal !== null ? oldVal : "");
                    const newStr = Array.isArray(value) ? value.join(", ") : String(value !== undefined && value !== null ? value : "");
                    if (oldStr !== newStr) {
                        const niceKey = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        changes.push(`"${niceKey}" from "${oldStr || 'N/A'}" to "${newStr || 'N/A'}"`);
                    }
                }
                if (changes.length > 0) {
                    try {
                        await pb.collection("notifications").create({
                            title: "User Updated",
                            message: `Updated user ${oldUser.name}: changed ${changes.join(", ")}`,
                            time: new Date().toISOString(),
                            read: false,
                            type: "info"
                        });
                    } catch (e) {
                        console.error("Failed to add notification for update user:", e);
                    }
                    try {
                        await createUpdateLog({
                            officer_name: oldUser.name || "N/A",
                            update_type: data.status !== undefined && data.status !== oldUser.status ? "User Status Changed" : "User Profile Updated",
                            description: `Updated system user ${oldUser.name}: changed ${changes.join(", ")}`,
                            previous_value: `Original Profile`,
                            new_value: changes.join(", "),
                            priority: "Medium"
                        });
                    } catch (e) {
                        console.error("Failed to log updateUser to update_logs:", e);
                    }
                }
            }
            await get().fetchUsers();
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    },

    deleteUser: async (id) => {
        try {
            const oldUser = get().users.find((u) => u.id === id);
            await pb.collection("users").delete(id);
            if (oldUser) {
                try {
                    await pb.collection("notifications").create({
                        title: "User Deleted",
                        message: `Deleted user: ${oldUser.name} (${oldUser.email || 'N/A'})`,
                        time: new Date().toISOString(),
                        read: false,
                        type: "warning"
                    });
                } catch (e) {
                    console.error("Failed to add notification for deleted user:", e);
                }
                try {
                    await createUpdateLog({
                        officer_name: oldUser.name || "N/A",
                        update_type: "User Account Removed",
                        description: `Deleted system user: ${oldUser.name} (${oldUser.email || 'N/A'})`,
                        previous_value: `Email: ${oldUser.email || 'N/A'}`,
                        priority: "High"
                    });
                } catch (e) {
                    console.error("Failed to log deleteUser to update_logs:", e);
                }
            }
            set((state) => ({
                users: state.users.filter((u) => u.id !== id),
                totalCount: state.totalCount - 1,
            }));
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    },

    bulkDelete: async (ids) => {
        try {
            const deletedNames = get().users.filter((u) => ids.includes(u.id)).map((u) => u.name);
            for (const id of ids) {
                await pb.collection("users").delete(id);
            }
            if (deletedNames.length > 0) {
                try {
                    await pb.collection("notifications").create({
                        title: "Multiple Users Deleted",
                        message: `Deleted users: ${deletedNames.join(", ")}`,
                        time: new Date().toISOString(),
                        read: false,
                        type: "warning"
                    });
                } catch (e) {
                    console.error("Failed to add notification for bulk delete users:", e);
                }
                try {
                    await createUpdateLog({
                        update_type: "Users Bulk Delete",
                        description: `Bulk deleted ${deletedNames.length} System Users: ${deletedNames.join(", ")}`,
                        previous_value: deletedNames.join(", "),
                        priority: "High"
                    });
                } catch (e) {
                    console.error("Failed to log bulkDelete to update_logs:", e);
                }
            }
            set((state) => ({
                users: state.users.filter((u) => !ids.includes(u.id)),
                totalCount: state.totalCount - ids.length,
            }));
        } catch (error) {
            console.error("Failed to bulk delete:", error);
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));