"use client";

import { create } from "zustand";
import type { IASOfficer, IPSOfficer, Meeting, UpdateLog, User, ActivityLog, Notification } from "@/types";

const sampleIASOfficers: IASOfficer[] = Array.from({ length: 64 }, (_, i) => {
  const id = String(i + 1);
  const statuses: IASOfficer["status"][] = ["Active", "Inactive", "Suspended"];
  const cadres = ["AGMUT", "Assam-Meghalaya", "Bihar", "Gujarat", "Karnataka"];
  const states = ["Maharashtra", "Karnataka", "Gujarat", "Tamil Nadu", "Delhi"];
  const positions = ["District Collector", "Joint Secretary", "Principal Secretary", "Chief Secretary", "Additional Secretary"];
  const departments = ["Revenue", "Finance", "Home", "Education", "Health"];
  return {
    id,
    officer_id: `IAS${String(i + 1).padStart(4, "0")}`,
    name: `IAS Officer ${id}`,
    batch_year: 2010 + (i % 10),
    cadre: cadres[i % 5],
    current_position: positions[i % 5],
    department: departments[i % 5],
    state: states[i % 5],
    date_of_birth: `198${(i % 9)}-0${1 + (i % 9)}-15`,
    appointment_date: `201${(i % 5)}-0${1 + (i % 9)}-01`,
    contact_number: `+91-9876543${String(i).padStart(3, "0")}`,
    email: `ias.officer.${id}@gov.in`,
    status: statuses[i % 3],
    photo_url: `https://ui-avatars.com/api/?name=IAS+Officer+${id}&background=6366f1&color=fff`,
    qualification: ["M.A. Public Administration", "B.Tech", "MBA", "LLB", "M.Sc."][i % 5],
    address: `${100 + i} Civil Lines, ${states[i % 5]}`,
    previous_postings: ["Sub-Collector, Pune", "SDM, Bangalore", "CEO, Zilla Parishad", "Municipal Commissioner, Ahmedabad"].slice(0, 1 + (i % 3)),
    created: new Date(Date.now() - i * 86400000).toISOString(),
    updated: new Date(Date.now() - i * 43200000).toISOString(),
    source: ["Direct Recruitment", "Promotion", "Deputation", "Emergency"][i % 4],
    domicile: states[i % 5],
    pay_level: ["Level 13", "Level 14", "Level 15", "Level 16"][i % 4],
    central_deputation: ["Yes", "No"][i % 2],
    twitter_x: "",
    linkedin: "",
    instagram: "",
    mobile_no: `+91-9876543${String(i).padStart(3, "0")}`,
    remarks: "",
  };
});

const sampleIPSOfficers: IPSOfficer[] = Array.from({ length: 48 }, (_, i) => {
  const id = String(i + 1);
  const statuses: IPSOfficer["status"][] = ["Active", "Inactive", "Suspended"];
  const cadres = ["AGMUT", "Assam-Meghalaya", "Bihar", "Gujarat", "Karnataka"];
  const states = ["Maharashtra", "Karnataka", "Gujarat", "Tamil Nadu", "Delhi"];
  const ranks = ["DG", "ADG", "IG", "DIG", "SP", "DSP"];
  const positions = ["Director General", "Additional DG", "Inspector General", "Deputy IG", "Superintendent", "Deputy SP"];
  const specializations = ["Cyber Crime", "Traffic", "Investigation", "Intelligence", "Security"];
  return {
    id,
    name: `IPS Officer ${id}`,
    batch_year: 2010 + (i % 10),
    cadre: cadres[i % 5],
    current_position: positions[i % 6],
    rank: ranks[i % 6],
    police_station: `Police Station ${id}`,
    range: `Range ${1 + (i % 5)}`,
    state: states[i % 5],
    date_of_birth: `198${(i % 9)}-0${1 + (i % 9)}-15`,
    appointment_date: `201${(i % 5)}-0${1 + (i % 9)}-01`,
    contact_number: `+91-9876543${String(100 + i).slice(1)}`,
    email: `ips.officer.${id}@gov.in`,
    status: statuses[i % 3],
    photo_url: `/api/files/officers/${id}/photo.jpg`,
    specialization: specializations.slice(0, 1 + (i % 3)),
    awards: ["President's Police Medal", "Police Medal", "Meritorious Service"].slice(0, 1 + (i % 3)),
    created: new Date(Date.now() - i * 86400000).toISOString(),
    updated: new Date(Date.now() - i * 43200000).toISOString(),
  };
});

const sampleMeetings: Meeting[] = Array.from({ length: 32 }, (_, i) => {
  const id = String(i + 1);
  const types: Meeting["officer_type"][] = ["IAS", "IPS"];
  const statuses: Meeting["status"][] = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];
  const type = types[i % 2];
  return {
    id,
    officer_id: String(1 + (i % 10)),
    officer_name: `${type} Officer ${1 + (i % 10)}`,
    officer_type: type,
    designation: "District Collector",
    department: ["Revenue", "Finance", "Home", "Education", "Health"][i % 5],
    meeting_date: `2026-05-${String(10 + (i % 20)).padStart(2, "0")}`,
    meeting_time: `${String(9 + (i % 9)).padStart(2, "0")}:00`,
    duration: 30 + (i % 5) * 15,
    location: `Conference Room ${1 + (i % 5)}`,
    agenda: "Review progress of ongoing projects and discuss upcoming initiatives",
    status: statuses[i % 4],
    attendees: ["Director", "Joint Secretary", "Deputy Secretary", "Section Officer"].slice(0, 1 + (i % 4)),
    notes: "Discussion focused on timelines and resource allocation.",
    documents: [],
    created_by: "Admin",
    follow_up_date: `2026-06-${String(10 + (i % 20)).padStart(2, "0")}`,
    created: new Date(Date.now() - i * 86400000).toISOString(),
    updated: new Date(Date.now() - i * 43200000).toISOString(),
  };
});

const sampleUpdateLogs: UpdateLog[] = Array.from({ length: 40 }, (_, i) => {
  const id = String(i + 1);
  const updateTypes = ["Meeting Completed", "Officer Transferred", "New Appointment", "Department Change"];
  const priorities: UpdateLog["priority"][] = ["Low", "Medium", "High"];
  return {
    id,
    meeting_id: String(1 + (i % 15)),
    officer_name: `Officer ${1 + (i % 20)}`,
    update_type: updateTypes[i % 4],
    description: `System update: ${updateTypes[i % 4].toLowerCase()} processed successfully`,
    previous_value: "Status: Pending",
    new_value: "Status: Completed",
    completed_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_by: "Admin",
    priority: priorities[i % 3],
    attachments: [`https://example.com/attachment${id}.pdf`],
    created: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

const sampleUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@civiltracking.gov.in", role: "Super Admin", permissions: ["read", "write", "delete", "manage_users"], department: "Administration", phone: "+91-9876543210", status: "Active", last_login: new Date().toISOString(), created: "2024-01-01T00:00:00Z", updated: new Date().toISOString() },
  { id: "2", name: "Super Admin", email: "superadmin@civiltracking.gov.in", role: "Super Admin", permissions: ["read", "write", "delete", "manage_users", "system_settings"], department: "Administration", phone: "+91-9876543211", status: "Active", last_login: new Date().toISOString(), created: "2024-01-01T00:00:00Z", updated: new Date().toISOString() },
  { id: "3", name: "Regular User", email: "user@civiltracking.gov.in", role: "Viewer", permissions: ["read"], department: "General", phone: "+91-9876543212", status: "Active", last_login: new Date(Date.now() - 86400000).toISOString(), created: "2024-02-01T00:00:00Z", updated: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", name: "Officer Sharma", email: "officer.sharma@gov.in", role: "Officer", permissions: ["read", "write_own"], department: "Revenue", phone: "+91-9876543213", status: "Active", last_login: new Date(Date.now() - 172800000).toISOString(), created: "2024-03-01T00:00:00Z", updated: new Date(Date.now() - 172800000).toISOString() },
  { id: "5", name: "Viewer Patil", email: "viewer.patil@gov.in", role: "Viewer", permissions: ["read"], department: "Finance", phone: "+91-9876543214", status: "Inactive", last_login: new Date(Date.now() - 604800000).toISOString(), created: "2024-03-15T00:00:00Z", updated: new Date(Date.now() - 604800000).toISOString() },
];

const sampleActivityLogs: ActivityLog[] = Array.from({ length: 50 }, (_, i) => {
  const id = String(i + 1);
  const actions: ActivityLog["action"][] = ["created", "updated", "deleted", "login", "logout"];
  const resourceTypes: ActivityLog["resource_type"][] = ["meeting", "officer", "user", "report"];
  const action = actions[i % 5];
  const resourceType = resourceTypes[i % 4];
  return {
    id,
    user_id: String(1 + (i % 5)),
    user_name: ["Admin", "Super Admin", "User", "Officer", "Viewer"][i % 5],
    action,
    resource_type: resourceType,
    resource_id: String(1 + (i % 20)),
    details: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resourceType} record`,
    ip_address: `192.168.1.${10 + (i % 50)}`,
    user_agent: ["Chrome", "Firefox", "Safari", "Edge"][i % 4],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  };
});

const sampleNotifications: Notification[] = [
  { id: "1", title: "Meeting Scheduled", message: "New meeting with Shri Rajesh Kumar (IAS) scheduled for May 22, 11:00 AM", time: "2 minutes ago", read: false, type: "info" },
  { id: "2", title: "Update Completed", message: "Monthly compliance report has been updated successfully", time: "15 minutes ago", read: false, type: "success" },
  { id: "3", title: "Officer Transferred", message: "Smt. Priya Sharma (IPS) has been transferred to Delhi cadre", time: "1 hour ago", read: true, type: "warning" },
  { id: "4", title: "System Alert", message: "Database backup completed successfully", time: "2 hours ago", read: true, type: "info" },
  { id: "5", title: "New Appointment", message: "Dr. Anand Patel appointed as Joint Secretary", time: "3 hours ago", read: false, type: "success" },
];

export const useIASDatabaseStore = create<{
  officers: IASOfficer[];
  setOfficers: (officers: IASOfficer[]) => void;
  addOfficer: (officer: IASOfficer) => void;
  updateOfficer: (id: string, data: Partial<IASOfficer>) => void;
  deleteOfficer: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchOfficers: (page?: number, pageSize?: number) => Promise<void>;
}>((set) => ({
  officers: sampleIASOfficers,
  totalCount: sampleIASOfficers.length,
  currentPage: 1,
  pageSize: 20,
  setOfficers: (officers) => set({ officers, totalCount: officers.length }),
  addOfficer: (officer) => set((state) => ({ officers: [officer, ...state.officers], totalCount: state.totalCount + 1 })),
  updateOfficer: (id, data) => set((state) => ({
    officers: state.officers.map((o) => o.id === id ? { ...o, ...data, updated: new Date().toISOString() } : o),
  })),
  deleteOfficer: (id) => set((state) => ({
    officers: state.officers.filter((o) => o.id !== id),
    selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    totalCount: Math.max(0, state.totalCount - 1),
  })),
  bulkDelete: (ids) => set((state) => ({
    officers: state.officers.filter((o) => !ids.includes(o.id)),
    selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    totalCount: Math.max(0, state.totalCount - ids.length),
  })),
  selectedIds: [],
  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  fetchOfficers: async () => {},
}));

export const useIPSDatabaseStore = create<{
  officers: IPSOfficer[];
  setOfficers: (officers: IPSOfficer[]) => void;
  addOfficer: (officer: IPSOfficer) => void;
  updateOfficer: (id: string, data: Partial<IPSOfficer>) => void;
  deleteOfficer: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchOfficers: (page?: number, pageSize?: number) => Promise<void>;
}>((set) => ({
  officers: sampleIPSOfficers,
  totalCount: sampleIPSOfficers.length,
  currentPage: 1,
  pageSize: 20,
  setOfficers: (officers) => set({ officers, totalCount: officers.length }),
  addOfficer: (officer) => set((state) => ({ officers: [officer, ...state.officers], totalCount: state.totalCount + 1 })),
  updateOfficer: (id, data) => set((state) => ({
    officers: state.officers.map((o) => o.id === id ? { ...o, ...data, updated: new Date().toISOString() } : o),
  })),
  deleteOfficer: (id) => set((state) => ({
    officers: state.officers.filter((o) => o.id !== id),
    selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    totalCount: Math.max(0, state.totalCount - 1),
  })),
  bulkDelete: (ids) => set((state) => ({
    officers: state.officers.filter((o) => !ids.includes(o.id)),
    selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    totalCount: Math.max(0, state.totalCount - ids.length),
  })),
  selectedIds: [],
  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  fetchOfficers: async () => {},
}));

export const useMeetingsStore = create<{
  meetings: Meeting[];
  setMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, data: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchMeetings: (page?: number, pageSize?: number) => Promise<void>;
}>((set) => ({
  meetings: sampleMeetings,
  totalCount: sampleMeetings.length,
  currentPage: 1,
  pageSize: 20,
  setMeetings: (meetings) => set({ meetings, totalCount: meetings.length }),
  addMeeting: (meeting) => set((state) => ({ meetings: [meeting, ...state.meetings], totalCount: state.totalCount + 1 })),
  updateMeeting: (id, data) => set((state) => ({
    meetings: state.meetings.map((m) => m.id === id ? { ...m, ...data, updated: new Date().toISOString() } : m),
  })),
  deleteMeeting: (id) => {
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
      totalCount: Math.max(0, state.totalCount - 1),
    }));
  },
  bulkDelete: (ids) => {
    set((state) => ({
      meetings: state.meetings.filter((m) => !ids.includes(m.id)),
      totalCount: Math.max(0, state.totalCount - ids.length),
    }));
  },
  selectedIds: [],
  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  fetchMeetings: async () => {},
}));

export const useUpdateLogsStore = create<{
  logs: UpdateLog[];
  setLogs: (logs: UpdateLog[]) => void;
  addLog: (log: UpdateLog) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchLogs: (page?: number, pageSize?: number) => Promise<void>;
}>((set) => ({
  logs: sampleUpdateLogs,
  totalCount: sampleUpdateLogs.length,
  currentPage: 1,
  pageSize: 20,
  setLogs: (logs) => set({ logs, totalCount: logs.length }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs], totalCount: state.totalCount + 1 })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  fetchLogs: async () => {},
}));

export const useUsersStore = create<{
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchUsers: (page?: number, pageSize?: number) => Promise<void>;
}>((set, get) => ({
  users: sampleUsers.slice(0, 20),
  totalCount: sampleUsers.length,
  currentPage: 1,
  pageSize: 20,
  fetchUsers: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const all = sampleUsers;
    const start = (page - 1) * pageSize;
    set({ users: all.slice(start, start + pageSize), totalCount: all.length, isLoading: false });
  },
  setUsers: (users) => set({ users, totalCount: users.length }),
  addUser: (user) => {
    set((state) => ({
      users: [user, ...state.users],
      totalCount: state.totalCount + 1,
    }));
  },
  updateUser: (id, data) => set((state) => ({
    users: state.users.map((u) => u.id === id ? { ...u, ...data, updated: new Date().toISOString() } : u),
  })),
  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      totalCount: Math.max(0, state.totalCount - 1),
    }));
  },
  bulkDelete: (ids) => {
    set((state) => ({
      users: state.users.filter((u) => !ids.includes(u.id)),
      totalCount: Math.max(0, state.totalCount - ids.length),
    }));
  },
  selectedIds: [],
  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
}));

export const useActivityLogStore = create<{
  logs: ActivityLog[];
  setLogs: (logs: ActivityLog[]) => void;
  addLog: (log: ActivityLog) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchLogs: (page?: number, pageSize?: number) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}>((set) => ({
  logs: sampleActivityLogs.slice(0, 20),
  totalCount: sampleActivityLogs.length,
  currentPage: 1,
  pageSize: 20,
  isLoading: false,
  error: null,
  setLogs: (logs) => set({ logs, totalCount: logs.length }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs], totalCount: state.totalCount + 1 })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  fetchLogs: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const all = sampleActivityLogs;
    const start = (page - 1) * pageSize;
    set({ logs: all.slice(start, start + pageSize), totalCount: all.length, isLoading: false });
  },
}));

export const useNotificationsStore = create<{
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  addNotification: (notification: Notification) => void;
}>((set) => ({
  notifications: sampleNotifications,
  markRead: (id) => set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  markAllRead: () => set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
  clearAll: () => set({ notifications: [] }),
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
}));
