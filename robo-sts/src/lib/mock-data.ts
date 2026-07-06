import type { Officer, Meeting, UpdateLog, User, ActivityLog, ChartDataPoint } from "@/types";

export const officers: Officer[] = [
  { id: "1", name: "Shri Rajesh Kumar", serviceType: "IAS", designation: "District Collector", department: "Revenue", state: "Maharashtra", contact: "+91-9876543210", email: "rajesh.kumar@gov.in", status: "active", joinDate: "2015-06-01" },
  { id: "2", name: "Smt. Priya Sharma", serviceType: "IPS", designation: "Superintendent of Police", department: "Home", state: "Karnataka", contact: "+91-9876543211", email: "priya.sharma@gov.in", status: "active", joinDate: "2014-09-15" },
  { id: "3", name: "Dr. Anand Patel", serviceType: "IAS", designation: "Joint Secretary", department: "Finance", state: "Gujarat", contact: "+91-9876543212", email: "anand.patel@gov.in", status: "active", joinDate: "2012-01-20" },
  { id: "4", name: "Shri Vikram Singh", serviceType: "IPS", designation: "Deputy Inspector General", department: "Home", state: "Rajasthan", contact: "+91-9876543213", email: "vikram.singh@gov.in", status: "on_leave", joinDate: "2013-07-10" },
  { id: "5", name: "Smt. Lakshmi Iyer", serviceType: "IAS", designation: "Principal Secretary", department: "Education", state: "Tamil Nadu", contact: "+91-9876543214", email: "lakshmi.iyer@gov.in", status: "active", joinDate: "2010-03-05" },
  { id: "6", name: "Shri Arjun Reddy", serviceType: "IPS", designation: "Inspector General", department: "CBI", state: "Telangana", contact: "+91-9876543215", email: "arjun.reddy@gov.in", status: "active", joinDate: "2011-11-22" },
  { id: "7", name: "Dr. Meera Joshi", serviceType: "IAS", designation: "Chief Secretary", department: "General Administration", state: "Maharashtra", contact: "+91-9876543216", email: "meera.joshi@gov.in", status: "active", joinDate: "2008-08-14" },
  { id: "8", name: "Shmt. Kavitha Nair", serviceType: "IPS", designation: "Commissioner of Police", department: "Home", state: "Kerala", contact: "+91-9876543217", email: "kavitha.nair@gov.in", status: "active", joinDate: "2016-05-30" },
  { id: "9", name: "Shri Ravi Verma", serviceType: "IAS", designation: "Secretary", department: "Revenue", state: "Uttar Pradesh", contact: "+91-9876543218", email: "ravi.verma@gov.in", status: "active", joinDate: "2017-02-28" },
  { id: "10", name: "Smt. Sunita Devi", serviceType: "IPS", designation: "Additional Director General", department: "NIA", state: "Delhi", contact: "+91-9876543219", email: "sunita.devi@gov.in", status: "active", joinDate: "2015-08-10" },
];

export const meetings: Meeting[] = [
  { id: "1", officer_id: "1", officer_name: "Shri Rajesh Kumar", officer_type: "IAS", designation: "District Collector", department: "Revenue", meeting_date: "2026-05-21", meeting_time: "11:00 AM", duration: 60, location: "Collector Office, Mumbai", agenda: "Quarterly Revenue Review", status: "Scheduled", attendees: [], notes: "", documents: [], created_by: "1", follow_up_date: "", created: "2026-05-21T00:00:00Z", updated: "2026-05-21T00:00:00Z" },
  { id: "2", officer_id: "2", officer_name: "Smt. Priya Sharma", officer_type: "IPS", designation: "Superintendent of Police", department: "Home", meeting_date: "2026-05-22", meeting_time: "02:30 PM", duration: 60, location: "SP Office, Bangalore", agenda: "Law and Order Review", status: "Scheduled", attendees: [], notes: "", documents: [], created_by: "2", follow_up_date: "", created: "2026-05-22T00:00:00Z", updated: "2026-05-22T00:00:00Z" },
  { id: "3", officer_id: "3", officer_name: "Dr. Anand Patel", officer_type: "IAS", designation: "Joint Secretary", department: "Finance", meeting_date: "2026-05-23", meeting_time: "10:00 AM", duration: 60, location: "Finance Bhawan, Gandhinagar", agenda: "Budget Planning Discussion", status: "Completed", attendees: [], notes: "", documents: [], created_by: "1", follow_up_date: "", created: "2026-05-23T00:00:00Z", updated: "2026-05-23T00:00:00Z" },
  { id: "4", officer_id: "6", officer_name: "Shri Arjun Reddy", officer_type: "IPS", designation: "Inspector General", department: "CBI", meeting_date: "2026-05-24", meeting_time: "11:30 AM", duration: 60, location: "CBI Office, Hyderabad", agenda: "Investigation Review Meeting", status: "Scheduled", attendees: [], notes: "", documents: [], created_by: "3", follow_up_date: "", created: "2026-05-24T00:00:00Z", updated: "2026-05-24T00:00:00Z" },
  { id: "5", officer_id: "7", officer_name: "Dr. Meera Joshi", officer_type: "IAS", designation: "Chief Secretary", department: "General Administration", meeting_date: "2026-05-25", meeting_time: "03:00 PM", duration: 60, location: "Mantralaya, Mumbai", agenda: "Cabinet Committee Meeting", status: "Scheduled", attendees: [], notes: "", documents: [], created_by: "1", follow_up_date: "", created: "2026-05-25T00:00:00Z", updated: "2026-05-25T00:00:00Z" },
];

export const meetingsChartData: ChartDataPoint[] = [
  { name: "1-7 May", scheduled: 48, completed: 42 },
  { name: "8-14 May", scheduled: 52, completed: 38 },
  { name: "15-21 May", scheduled: 45, completed: 45 },
  { name: "22-28 May", scheduled: 38, completed: 30 },
  { name: "29-31 May", scheduled: 15, completed: 12 },
];

export const updates: UpdateLog[] = [
  { id: "1", meeting_id: "3", officer_name: "Dr. Anand Patel", update_type: "Meeting Completed", description: "Budget planning discussion completed successfully", previous_value: "Pending", new_value: "Completed", completed_at: "2026-05-23T10:45:00Z", updated_by: "Admin", priority: "Medium", attachments: [], created: "2026-05-23T10:45:00Z" },
  { id: "2", meeting_id: "7", officer_name: "Dr. Meera Joshi", update_type: "Meeting Completed", description: "Cabinet committee meeting outcomes recorded", previous_value: "Pending", new_value: "Completed", completed_at: "2026-05-22T16:15:00Z", updated_by: "Admin", priority: "Medium", attachments: [], created: "2026-05-22T16:15:00Z" },
  { id: "3", meeting_id: "5", officer_name: "Smt. Lakshmi Iyer", update_type: "Meeting Completed", description: "Education reform progress reviewed and documented", previous_value: "Pending", new_value: "Completed", completed_at: "2026-05-21T14:30:00Z", updated_by: "Admin", priority: "Low", attachments: [], created: "2026-05-21T14:30:00Z" },
  { id: "4", meeting_id: "8", officer_name: "Shmt. Kavitha Nair", update_type: "Department Change", description: "Infrastructure development plan finalised", previous_value: "Old Dept", new_value: "New Dept", completed_at: "2026-05-20T17:00:00Z", updated_by: "Admin", priority: "High", attachments: [], created: "2026-05-20T17:00:00Z" },
  { id: "5", meeting_id: "2", officer_name: "Smt. Priya Sharma", update_type: "Meeting Completed", description: "Law enforcement coordination meeting completed", previous_value: "Pending", new_value: "Completed", completed_at: "2026-05-19T11:30:00Z", updated_by: "Admin", priority: "Medium", attachments: [], created: "2026-05-19T11:30:00Z" },
];

export const activities: ActivityLog[] = [
  { id: "1", user_id: "1", user_name: "Admin", action: "created", resource_type: "meeting", resource_id: "1", details: "Scheduled new meeting with Shri Rajesh Kumar", ip_address: "192.168.1.1", user_agent: "Chrome", timestamp: "2026-05-21T09:00:00Z" },
  { id: "2", user_id: "2", user_name: "Super Admin", action: "updated", resource_type: "officer", resource_id: "2", details: "Updated officer profile for Smt. Priya Sharma", ip_address: "192.168.1.2", user_agent: "Firefox", timestamp: "2026-05-21T08:30:00Z" },
  { id: "3", user_id: "1", user_name: "Admin", action: "created", resource_type: "report", resource_id: "1", details: "Generated monthly compliance report", ip_address: "192.168.1.1", user_agent: "Chrome", timestamp: "2026-05-20T17:45:00Z" },
  { id: "4", user_id: "3", user_name: "User", action: "updated", resource_type: "meeting", resource_id: "3", details: "Marked meeting as completed for Dr. Anand Patel", ip_address: "192.168.1.3", user_agent: "Safari", timestamp: "2026-05-20T16:00:00Z" },
  { id: "5", user_id: "2", user_name: "Super Admin", action: "created", resource_type: "officer", resource_id: "1", details: "Added new IPS officer record", ip_address: "192.168.1.2", user_agent: "Firefox", timestamp: "2026-05-20T11:00:00Z" },
  { id: "6", user_id: "1", user_name: "Admin", action: "created", resource_type: "notification", resource_id: "1", details: "Sent meeting reminder to all stakeholders", ip_address: "192.168.1.1", user_agent: "Chrome", timestamp: "2026-05-19T09:30:00Z" },
];

export const users: User[] = [
  { id: "1", name: "Admin User", email: "admin@civiltracking.gov.in", role: "Admin", permissions: ["read", "write", "delete", "manage_users"], department: "Administration", phone: "+91-9876543210", status: "Active", last_login: "2026-05-21T09:00:00Z", created: "2024-01-01T00:00:00Z", updated: "2026-05-21T09:00:00Z" },
  { id: "2", name: "Super Admin", email: "superadmin@civiltracking.gov.in", role: "Super Admin", permissions: ["read", "write", "delete", "manage_users", "system_settings"], department: "Administration", phone: "+91-9876543211", status: "Active", last_login: "2026-05-21T08:00:00Z", created: "2024-01-01T00:00:00Z", updated: "2026-05-21T08:00:00Z" },
  { id: "3", name: "Regular User", email: "user@civiltracking.gov.in", role: "Viewer", permissions: ["read"], department: "General", phone: "+91-9876543212", status: "Active", last_login: "2026-05-20T17:00:00Z", created: "2024-02-01T00:00:00Z", updated: "2026-05-20T17:00:00Z" },
];

export const systemSummary = {
  totalMeetings: 1248,
  completed: 980,
  pending: 268,
  overdue: 12,
  completionRate: 78,
};

export const iasCount = 6854;
export const ipsCount = 4327;
export const meetingsThisMonth = 128;
export const updatesCompleted = 96;
