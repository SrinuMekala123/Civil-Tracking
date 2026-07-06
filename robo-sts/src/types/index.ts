export interface Officer {
  id: string;
  name: string;
  serviceType: "IAS" | "IPS";
  designation: string;
  department: string;
  state: string;
  contact: string;
  email: string;
  status: "active" | "retired" | "on_leave" | "transferred";
  joinDate: string;
  photo?: string;
}

// ✅ UPDATED: Added new fields
export interface IASOfficer {
  id: string;
  name: string;
  batch_year: number;
  cadre: string;
  current_position: string;
  department: string;
  state: string;
  date_of_birth: string;
  appointment_date: string;
  contact_number: string;
  email: string;
  status: "Active" | "Inactive" | "Suspended";
  photo_url: string;
  qualification: string;
  address: string;
  previous_postings: string[];
  created: string;
  updated: string;

  // ✅ NEW FIELDS
  officer_id: string;
  source: string;
  domicile: string;
  pay_level: string;
  central_deputation: string;
  twitter_x: string;
  linkedin: string;
  instagram: string;
  mobile_no: string;
  remarks: string;
}

export interface IPSOfficer {
  id: string;
  name: string;
  batch_year: number;
  cadre: string;
  current_position: string;
  rank: string;
  police_station: string;
  range: string;
  state: string;
  date_of_birth: string;
  appointment_date: string;
  contact_number: string;
  email: string;
  status: "Active" | "Inactive" | "Suspended";
  photo_url: string;
  specialization: string[];
  awards: string[];
  created: string;
  updated: string;
}

export interface Meeting {
  id: string;
  officer_id: string;
  officer_name: string;
  officer_type: "IAS" | "IPS";
  designation: string;
  department: string;
  meeting_date: string;
  meeting_time: string;
  duration: number;
  location: string;
  agenda: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  attendees: string[];
  notes: string;
  documents: string[];
  created_by: string;
  follow_up_date: string;
  created: string;
  updated: string;
}

export interface UpdateLog {
  id: string;
  meeting_id: string;
  officer_name: string;
  update_type: string;
  description: string;
  previous_value: string;
  new_value: string;
  completed_at: string;
  updated_by: string;
  priority: "Low" | "Medium" | "High";
  attachments: string[];
  created: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Officer" | "Viewer";
  permissions: string[];
  department: string;
  phone: string;
  status: "Active" | "Inactive" | "Suspended";
  last_login: string;
  created: string;
  updated: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

export interface ChartDataPoint {
  name: string;
  scheduled: number;
  completed: number;
}

export interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export type ThemeMode = "light" | "dark" | "system";

export type IASOfficerFormValues = {
  name: string;
  batch_year: number;
  cadre: string;
  current_position?: string;  // ✅ Make optional (add ?)
  department?: string;
  state?: string;
  date_of_birth?: string;
  appointment_date?: string;
  contact_number?: string;
  email: string;
  status: "Active" | "Inactive" | "Suspended";
  photo_url?: string;
  qualification?: string;
  address?: string;
  previous_postings?: string;
  officer_id?: string;
  source?: string;
  domicile?: string;
  pay_level?: string;
  central_deputation?: string;
  twitter_x?: string;
  linkedin?: string;
  instagram?: string;
  mobile_no?: string;
  remarks?: string;
};



export type MeetingFormValues = {
  officer_id: string;
  officer_name: string;
  officer_type: "IAS" | "IPS";
  designation: string;
  department: string;
  meeting_date: string;
  meeting_time: string;
  duration: number;
  location: string;
  agenda: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  attendees?: string;
  notes?: string;
  documents?: string;
  created_by: string;
  follow_up_date?: string;
};
// Add this to src/types/index.ts

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: string; // meeting, appointment, follow_up, etc.
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  location?: string;
  description?: string;
  color?: string;

  // Relations
  ias_officer_id?: string;
  ips_officer_id?: string;

  // Expanded data (filled by the store)
  officer_name?: string;
  officer_type?: "IAS" | "IPS";
  officer_cadre?: string;
}