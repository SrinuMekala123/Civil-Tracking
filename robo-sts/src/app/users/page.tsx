"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useUsersStore } from "@/store/users-store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserFormModal } from "@/app/users/components/user-form-modal";
import { UserViewModal } from "@/app/users/components/user-view-modal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Loader2,
  RefreshCcw,
  CheckSquare,
  Square,
  Building2,
  Phone,
  Calendar,
} from "lucide-react";
import type { User } from "@/types";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";

const DEFAULT_PAGE_SIZE = 20;

export default function UserManagementPage() {
  const users = useUsersStore((s) => s.users);
  const isLoading = useUsersStore((s) => s.isLoading);
  const error = useUsersStore((s) => s.error);
  const totalCount = useUsersStore((s) => s.totalCount);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);
  const addUser = useUsersStore((s) => s.addUser);
  const updateUser = useUsersStore((s) => s.updateUser);
  const deleteUser = useUsersStore((s) => s.deleteUser);
  const bulkDelete = useUsersStore((s) => s.bulkDelete);

  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [debouncedSearch] = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchUsers({
      role: roleFilter,
      department: departmentFilter,
      status: statusFilter,
      search: debouncedSearch || undefined,
    });
    setPageIndex(0);
  }, [debouncedSearch, roleFilter, departmentFilter, statusFilter, fetchUsers]);

  const filteredUsers = useMemo(() => {
    let data = users;
    const q = debouncedSearch.toLowerCase();
    if (q) {
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      data = data.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }
    return data;
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  const departments = useMemo(() => {
    const depts = new Set(users.map((u) => u.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const handleAdd = async (values: any) => {
    setSubmitting(true);
    try {
      const formatted = {
        ...values,
        permissions: values.permissions
          ? values.permissions.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      };
      await addUser(formatted);
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to add user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const formatted = {
        ...values,
        permissions: values.permissions
          ? values.permissions.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      };
      await updateUser(editingUser.id, formatted);
      setEditingUser(null);
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (type: "excel" | "pdf") => {
    try {
      const headers = [
        "User Name",
        "Email Address",
        "Role",
        "Department",
        "Phone",
        "Status",
        "Last Login"
      ];

      const rows = filteredUsers.map((u) => [
        u.name || "",
        u.email || "",
        u.role || "",
        u.department || "",
        u.phone || "",
        u.status || "",
        u.last_login ? new Date(u.last_login).toLocaleString() : "Never"
      ]);

      const filename = `users_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "User Management", headers, rows, {
          orientation: "landscape",
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    clearSelection();
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Inactive":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Suspended":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getRoleClasses = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Officer":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Viewer":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / DEFAULT_PAGE_SIZE));
  const startRecord = filteredUsers.length === 0 ? 0 : pageIndex * DEFAULT_PAGE_SIZE + 1;
  const endRecord = Math.min((pageIndex + 1) * DEFAULT_PAGE_SIZE, filteredUsers.length);

  const paginatedUsers = filteredUsers.slice(
    pageIndex * DEFAULT_PAGE_SIZE,
    (pageIndex + 1) * DEFAULT_PAGE_SIZE
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalCount} user{totalCount !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="gradient-button" onClick={() => { setEditingUser(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add New User
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsBulkDelete(true);
                  setDeleteId(null);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, department..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {roleFilter === "all" ? "All Roles" : (roleFilter || "Role")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Officer">Officer</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {departmentFilter === "all" ? "All Departments" : (departmentFilter || "Department")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept || "N/A"}>
                        {dept || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {statusFilter === "all" ? "All Status" : (statusFilter || "Status")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" onClick={() => fetchUsers()}>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">No users found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                      <Button variant="ghost" size="icon" className="h-4 w-4">
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/85 dark:hover:bg-slate-800/60 cursor-pointer group transition-colors duration-200"
                      onClick={() => setViewUser(user)}
                    >
                      <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => toggleSelected(user.id)}
                        >
                          {selectedIds.includes(user.id) ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {user.name}
                          </span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge className={getRoleClasses(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {user.department}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge className={getStatusClasses(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteId(user.id);
                              setIsBulkDelete(false);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Showing {startRecord}-{endRecord} of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Page {pageIndex + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <UserViewModal
          open={!!viewUser}
          user={viewUser}
          onOpenChange={(open) => {
            if (!open) setViewUser(null);
          }}
          onEdit={() => {
            if (viewUser) {
              setEditingUser(viewUser);
              setViewUser(null);
              setFormOpen(true);
            }
          }}
        />

        <UserFormModal
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingUser(null);
          }}
          user={editingUser}
          onSubmit={editingUser ? handleEdit : handleAdd}
          isSubmitting={submitting}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white font-semibold">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {isBulkDelete
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} selected users? This action cannot be undone.`
                  : "Are you sure you want to permanently delete this user? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  if (isBulkDelete) {
                    await bulkDelete(selectedIds);
                    clearSelection();
                  } else if (deleteId) {
                    await deleteUser(deleteId);
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}