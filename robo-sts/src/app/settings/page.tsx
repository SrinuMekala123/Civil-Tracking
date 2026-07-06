"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import pb from "@/lib/pocketbase";
import {
  Settings as SettingsIcon,
  Mail,
  Database,
  Users,
  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type TabType = "general" | "email" | "database" | "users" | "notifications" | "system" | "integrations" | "security";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  description?: string;
  updated_by?: string;
  updated_at?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role !== "Super Admin") {
        router.push("/");
      }
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Settings state for all categories
  const [settings, setSettings] = useState<Record<string, string>>({
    // General
    app_name: "Civil Tracking",
    timezone: "Asia/Kolkata",
    date_format: "DD/MM/YYYY",
    language: "en",
    theme: "light",
    items_per_page: "20",
    // Email
    smtp_host: "smtp.gmail.com",
    smtp_port: "587",
    email_from: "noreply@civiltracking.gov.in",
    // Database
    backup_frequency: "daily",
    auto_backup: "true",
    // Users
    profile_name: "Admin User",
    profile_email: "admin@civiltracking.gov.in",
    profile_password: "",
    // Notifications
    email_notifs: "true",
    browser_notifs: "true",
    reminder_pref: "1hour",
    // System
    maintenance_mode: "false",
    // Integrations
    gsheets_api_key: "",
    webhook_url: "",
    // Security
    max_login_attempts: "5",
    session_timeout: "30",
  });

  // Load settings from PocketBase on mount and when tab changes
  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const records: SystemSetting[] = await pb.collection("system_settings").getFullList({
        filter: `category = "${activeTab}"`,
        sort: "created",
      });

      const settingsMap: Record<string, string> = {};
      records.forEach((record) => {
        settingsMap[record.setting_key] = record.setting_value;
      });

      // Merge with existing settings
      setSettings((prev) => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error(`Failed to load ${activeTab} settings:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get existing settings for this category
      const existingRecords: SystemSetting[] = await pb.collection("system_settings").getFullList({
        filter: `category = "${activeTab}"`,
      });

      const existingMap = new Map(existingRecords.map((r) => [r.setting_key, r]));

      // Update or create each setting
      for (const [key, value] of Object.entries(settings)) {
        // Only save settings that belong to current category
        const record = existingMap.get(key);
        if (record && record.category === activeTab) {
          // Update existing
          await pb.collection("system_settings").update(record.id, {
            setting_value: value,
            updated_by: "Admin User",
            updated_at: new Date().toISOString(),
          });
        } else if (!record && getCategoryForKey(key) === activeTab) {
          // Create new (if it doesn't exist and belongs to this category)
          await pb.collection("system_settings").create({
            setting_key: key,
            setting_value: value,
            category: activeTab,
            updated_by: "Admin User",
            updated_at: new Date().toISOString(),
          });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to determine category for a setting key
  const getCategoryForKey = (key: string): string => {
    const generalKeys = ["app_name", "timezone", "date_format", "language", "theme", "items_per_page"];
    const emailKeys = ["smtp_host", "smtp_port", "email_from"];
    const databaseKeys = ["backup_frequency", "auto_backup"];
    const usersKeys = ["profile_name", "profile_email", "profile_password"];
    const notificationsKeys = ["email_notifs", "browser_notifs", "reminder_pref"];
    const systemKeys = ["maintenance_mode"];
    const integrationsKeys = ["gsheets_api_key", "webhook_url"];
    const securityKeys = ["max_login_attempts", "session_timeout"];

    if (generalKeys.includes(key)) return "general";
    if (emailKeys.includes(key)) return "email";
    if (databaseKeys.includes(key)) return "database";
    if (usersKeys.includes(key)) return "users";
    if (notificationsKeys.includes(key)) return "notifications";
    if (systemKeys.includes(key)) return "system";
    if (integrationsKeys.includes(key)) return "integrations";
    if (securityKeys.includes(key)) return "security";
    return "general";
  };

  const handleSettingChange = (key: string, value: string | null) => {
    if (value !== null) {
      setSettings((prev) => ({ ...prev, [key]: value }));
    }
  };

  const tabs = [
    { id: "general" as TabType, label: "General", icon: SettingsIcon },
    { id: "email" as TabType, label: "Email", icon: Mail },
    { id: "database" as TabType, label: "Database", icon: Database },
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "notifications" as TabType, label: "Notifications", icon: Bell },
    { id: "system" as TabType, label: "System", icon: Globe },
    { id: "integrations" as TabType, label: "Integrations", icon: Palette },
    { id: "security" as TabType, label: "Security", icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage system preferences and configuration.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* General Settings */}
            {activeTab === "general" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">General Settings</CardTitle>
                  <CardDescription>Basic application configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={settings.app_name || ""}
                      onChange={(e) => handleSettingChange("app_name", e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone || "Asia/Kolkata"}
                      onValueChange={(value) => handleSettingChange("timezone", value)}
                    >
                      <SelectTrigger id="timezone" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={settings.date_format || "DD/MM/YYYY"}
                      onValueChange={(value) => handleSettingChange("date_format", value)}
                    >
                      <SelectTrigger id="dateFormat" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.language || "en"}
                      onValueChange={(value) => handleSettingChange("language", value)}
                    >
                      <SelectTrigger id="language" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                        <SelectItem value="te">Telugu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.theme || "light"}
                      onValueChange={(value) => handleSettingChange("theme", value)}
                    >
                      <SelectTrigger id="theme" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="itemsPerPage">Items Per Page</Label>
                    <Select
                      value={settings.items_per_page || "20"}
                      onValueChange={(value) => handleSettingChange("items_per_page", value)}
                    >
                      <SelectTrigger id="itemsPerPage" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Email Settings</CardTitle>
                  <CardDescription>Configure email and SMTP settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtp_host || ""}
                      onChange={(e) => handleSettingChange("smtp_host", e.target.value)}
                      className="max-w-md"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={settings.smtp_port || ""}
                      onChange={(e) => handleSettingChange("smtp_port", e.target.value)}
                      className="max-w-md"
                      placeholder="587"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="emailFrom">Email From</Label>
                    <Input
                      id="emailFrom"
                      value={settings.email_from || ""}
                      onChange={(e) => handleSettingChange("email_from", e.target.value)}
                      className="max-w-md"
                      placeholder="noreply@civiltracking.gov.in"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Database Settings */}
            {activeTab === "database" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Database Settings</CardTitle>
                  <CardDescription>Configure database and backup settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={settings.backup_frequency || "daily"}
                      onValueChange={(value) => handleSettingChange("backup_frequency", value)}
                    >
                      <SelectTrigger id="backupFrequency" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="autoBackup">Auto Backup</Label>
                    <Select
                      value={settings.auto_backup || "true"}
                      onValueChange={(value) => handleSettingChange("auto_backup", value)}
                    >
                      <SelectTrigger id="autoBackup" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Settings */}
            {activeTab === "users" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">User Settings</CardTitle>
                  <CardDescription>Configure profile and password options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Profile Name</Label>
                    <Input
                      id="profileName"
                      value={settings.profile_name || "Admin User"}
                      onChange={(e) => handleSettingChange("profile_name", e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Email Address</Label>
                    <Input
                      id="profileEmail"
                      value={settings.profile_email || "admin@civiltracking.gov.in"}
                      onChange={(e) => handleSettingChange("profile_email", e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={settings.profile_password || ""}
                      onChange={(e) => handleSettingChange("profile_password", e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Notification Settings</CardTitle>
                  <CardDescription>Configure alert channels and alert timings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Receive summaries and event alerts via email</p>
                    </div>
                    <Select
                      value={settings.email_notifs || "true"}
                      onValueChange={(val) => handleSettingChange("email_notifs", val)}
                    >
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Browser Push Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enable real-time updates directly in the browser</p>
                    </div>
                    <Select
                      value={settings.browser_notifs || "true"}
                      onValueChange={(val) => handleSettingChange("browser_notifs", val)}
                    >
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="reminderPref">Meeting Reminder Preferences</Label>
                    <Select
                      value={settings.reminder_pref || "1hour"}
                      onValueChange={(value) => handleSettingChange("reminder_pref", value)}
                    >
                      <SelectTrigger id="reminderPref" className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">15 minutes before</SelectItem>
                        <SelectItem value="30min">30 minutes before</SelectItem>
                        <SelectItem value="1hour">1 hour before</SelectItem>
                        <SelectItem value="1day">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">System Settings</CardTitle>
                  <CardDescription>Manage maintenance status and system details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Maintenance Mode</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Put the app in offline maintenance mode</p>
                    </div>
                    <Select
                      value={settings.maintenance_mode || "false"}
                      onValueChange={(val) => handleSettingChange("maintenance_mode", val)}
                    >
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>System Information</Label>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1 text-slate-600 dark:text-slate-300 max-w-md">
                      <p><strong>App Version:</strong> 1.1.2</p>
                      <p><strong>Node Environment:</strong> production</p>
                      <p><strong>Database:</strong> PocketBase v0.22.0</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations Settings */}
            {activeTab === "integrations" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Integration Settings</CardTitle>
                  <CardDescription>Configure external API keys and webhooks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="gSheetsKey">Google Sheets API Key</Label>
                    <Input
                      id="gSheetsKey"
                      type="password"
                      value={settings.gsheets_api_key || ""}
                      onChange={(e) => handleSettingChange("gsheets_api_key", e.target.value)}
                      className="max-w-md"
                      placeholder="AIzaSy..."
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook Endpoint</Label>
                    <Input
                      id="webhookUrl"
                      value={settings.webhook_url || ""}
                      onChange={(e) => handleSettingChange("webhook_url", e.target.value)}
                      className="max-w-md"
                      placeholder="https://example.com/webhooks/civiltracking"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Security Settings</CardTitle>
                  <CardDescription>Configure security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.max_login_attempts || ""}
                      onChange={(e) => handleSettingChange("max_login_attempts", e.target.value)}
                      className="max-w-md"
                      placeholder="5"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.session_timeout || ""}
                      onChange={(e) => handleSettingChange("session_timeout", e.target.value)}
                      className="max-w-md"
                      placeholder="30"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saved ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}