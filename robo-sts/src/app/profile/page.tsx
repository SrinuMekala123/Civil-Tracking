"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useProfileStore } from "@/store/profile-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Save,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ProfilePage() {
  const { profile, isLoading, error, loadProfile, updateProfile } = useProfileStore();

  // Profile fields state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPasswords, setShowPasswords] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Sync state once profile is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
      setDepartment(profile.department);
      setRole(profile.role);
    }
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setIsSaving(true);

    const success = await updateProfile({
      name,
      email,
      phone,
      department,
      role,
    });

    setIsSaving(false);
    if (success) {
      setSuccessMsg("Profile details updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg("");
    setSuccessMsg("");

    if (!newPassword) {
      setPwErrorMsg("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsSaving(true);
    const success = await updateProfile({
      password: newPassword,
      oldPassword: currentPassword,
    });
    setIsSaving(false);

    if (success) {
      setSuccessMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setPwErrorMsg("Failed to update password. Please try again.");
    }
  };

  // Get initials for Avatar
  const getInitials = (nameStr: string) => {
    if (!nameStr) return "CT";
    return nameStr
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and manage your account details, preferences, and login credentials.
          </p>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Overview */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-0 shadow-lg text-center overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <CardContent className="p-6 -mt-12 relative">
                <div className="flex justify-center mb-4">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-3xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900 ring-4 ring-indigo-500/20">
                    {getInitials(name)}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name || "Loading..."}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{role || "User"}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {profile?.status || "Active"}
                </div>

                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-left space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{phone || "Not set"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{department}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Profile & Password Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile details Card */}
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your profile name, email, contact, and roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="bg-slate-50 dark:bg-slate-800 border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email Address</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="bg-slate-50 dark:bg-slate-800 border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone Number</Label>
                      <Input
                        id="profile-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9876543210"
                        className="bg-slate-50 dark:bg-slate-800 border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-dept">Department</Label>
                      <Select value={department} onValueChange={(val) => setDepartment(val || "")}>
                        <SelectTrigger id="profile-dept" className="bg-slate-50 dark:bg-slate-800 border-0">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administration">Administration</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="profile-role">User Role</Label>
                      <Select value={role} onValueChange={(val) => setRole(val || "")}>
                        <SelectTrigger id="profile-role" className="bg-slate-50 dark:bg-slate-800 border-0">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Officer">Officer</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving || isLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md px-6 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Details
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-indigo-500" />
                  Security Credentials
                </CardTitle>
                <CardDescription>Change your password to maintain account security.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSave} className="space-y-6">
                  {pwErrorMsg && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-sm animate-in fade-in duration-200">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span>{pwErrorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-pw">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-pw"
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-slate-50 dark:bg-slate-800 border-0 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-pw">New Password</Label>
                        <Input
                          id="new-pw"
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-slate-50 dark:bg-slate-800 border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-pw">Confirm New Password</Label>
                        <Input
                          id="confirm-pw"
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-slate-50 dark:bg-slate-800 border-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving || isLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md px-6 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
