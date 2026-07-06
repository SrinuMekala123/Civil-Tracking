"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OfficerFormModal } from "@/app/ips-database/components/officer-form-modal";
import { OfficerViewModal } from "@/app/ips-database/components/officer-view-modal";
import { useIPSDatabaseStore } from "@/store/ips-database-store";
import type { IPSOfficer } from "@/types";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
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
} from "lucide-react";

const columnHelper = createColumnHelper<IPSOfficer>();

const ALL_CADRES = [
  "AGMUT", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Assam-Meghalaya",
  "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const ALL_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

export default function IpsDatabasePage() {
  const officers = useIPSDatabaseStore((s) => s.officers);
  const isLoading = useIPSDatabaseStore((s) => s.isLoading);
  const error = useIPSDatabaseStore((s) => s.error);
  const totalCount = useIPSDatabaseStore((s) => s.totalCount);
  const currentPage = useIPSDatabaseStore((s) => s.currentPage);
  const pageSize = useIPSDatabaseStore((s) => s.pageSize);
  const fetchOfficers = useIPSDatabaseStore((s) => s.fetchOfficers);
  const updateOfficer = useIPSDatabaseStore((s) => s.updateOfficer);
  const deleteOfficer = useIPSDatabaseStore((s) => s.deleteOfficer);
  const bulkDelete = useIPSDatabaseStore((s) => s.bulkDelete);
  const addOfficer = useIPSDatabaseStore((s) => s.addOfficer);
  const selectedIds = useIPSDatabaseStore((s) => s.selectedIds);
  const toggleSelected = useIPSDatabaseStore((s) => s.toggleSelected);
  const clearSelection = useIPSDatabaseStore((s) => s.clearSelection);

  const [searchInput, setSearchInput] = useState("");
  const [cadreFilter, setCadreFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOfficer, setViewOfficer] = useState<IPSOfficer | null>(null);
  const [editingOfficer, setEditingOfficer] = useState<IPSOfficer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [debouncedSearch] = useDebounce(searchInput, 500);

  const cadres = useMemo(() => ALL_CADRES, []);
  const states = useMemo(() => ALL_STATES, []);

  useEffect(() => {
    fetchOfficers(1, pageSize, {
      cadre: cadreFilter,
      state: stateFilter,
      status: statusFilter,
      search: debouncedSearch || undefined,
    });
  }, [debouncedSearch, cadreFilter, stateFilter, statusFilter, fetchOfficers, pageSize]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => table.toggleAllRowsSelected()}>
            {table.getIsAllRowsSelected() ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </Button>
        ),
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => toggleSelected(row.original.id)}>
            {selectedIds.includes(row.original.id) ? (
              <CheckSquare className="h-4 w-4 text-indigo-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        ),
      }),
      columnHelper.display({
        id: "officer",
        header: "Officer Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <img
              src={row.original.photo_url}
              alt={row.original.name}
              className="h-9 w-9 rounded-full object-cover border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.original.name)}&background=dc2626&color=fff`;
              }}
            />
            <span className="font-medium text-slate-900 dark:text-white">{row.original.name}</span>
          </div>
        ),
      }),
      columnHelper.accessor("batch_year", {
        header: "Batch Year",
        cell: ({ row }) => <span className="pl-2">{row.original.batch_year}</span>,
      }),
      columnHelper.accessor("cadre", {
        header: "Cadre/State",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.cadre}</p>
            <p className="text-xs text-slate-500">{row.original.state}</p>
          </div>
        ),
      }),
      columnHelper.accessor("rank", {
        header: "Rank",
        cell: ({ row }) => {
          const rank = row.original.rank;
          const rankColors: Record<string, string> = {
            DG: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            ADG: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            IG: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            DIG: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            SP: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            DSP: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
          };
          return <Badge className={(rankColors[rank] || "bg-gray-100 text-gray-700") + " border-0"}>{rank}</Badge>;
        },
      }),
      columnHelper.accessor("current_position", {
        header: "Current Position",
      }),
      columnHelper.accessor("police_station", {
        header: "Police Station/Range",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.police_station}</p>
            <p className="text-xs text-slate-500">{row.original.range}</p>
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Official Email",
        cell: ({ row }) => (
          <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:underline truncate block max-w-[200px]">
            {row.original.email}
          </a>
        ),
      }),
      columnHelper.accessor("contact_number", {
        header: "Official Contact",
        cell: ({ getValue }) => {
          const val = getValue();
          return (!val || val === "#ERROR!") ? "NA" : val;
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const classes =
            status === "Active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : status === "Inactive"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
          return <Badge className={classes}>{status}</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewOfficer(row.original)} title="View Officer">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditingOfficer(row.original)} title="Edit Officer">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeleteId(row.original.id);
                setIsBulkDelete(false);
                setDeleteConfirmOpen(true);
              }}
              title="Delete Officer"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ),
      }),
    ],
    [selectedIds, toggleSelected]
  );

  const table = useReactTable({
    data: officers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchOfficers(newPage, pageSize, {
        cadre: cadreFilter,
        state: stateFilter,
        status: statusFilter,
        search: debouncedSearch || undefined,
      });
    }
  };

  const handleAdd = async (values: any) => {
    setSubmitting(true);
    try {
      const officerData = {
        name: values.name || "",
        batch_year: Number(values.batch_year) || 2015,
        cadre: values.cadre || "",
        current_position: values.current_position || "",
        rank: values.rank || "",
        police_station: values.police_station || "",
        range: values.range || "",
        state: values.state || "",
        date_of_birth: values.date_of_birth || "",
        appointment_date: values.appointment_date || "",
        contact_number: values.contact_number || "",
        email: values.email || "",
        status: values.status || "Active",
        photo_url: values.photo_url || "",
        specialization: values.specialization ? values.specialization.split(",").map((s: string) => s.trim()) : [],
        awards: values.awards ? values.awards.split(",").map((s: string) => s.trim()) : [],
      };
      await addOfficer(officerData);
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to add officer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingOfficer) return;
    setSubmitting(true);
    try {
      const officerData = {
        ...values,
        specialization: values.specialization ? values.specialization.split(",").map((s: string) => s.trim()) : editingOfficer.specialization,
        awards: values.awards ? values.awards.split(",").map((s: string) => s.trim()) : editingOfficer.awards,
      };
      await updateOfficer(editingOfficer.id, officerData);
      setEditingOfficer(null);
    } catch (error) {
      console.error("Failed to update officer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (type: "excel" | "pdf") => {
    try {
      const parts: string[] = [];
      if (cadreFilter && cadreFilter !== "all") parts.push(`cadre~"${cadreFilter}"`);
      if (stateFilter && stateFilter !== "all") parts.push(`state~"${stateFilter}"`);
      if (statusFilter && statusFilter !== "all") parts.push(`status~"${statusFilter}"`);
      if (debouncedSearch) {
        const q = debouncedSearch;
        const num = Number(q);
        const isNum = !isNaN(num) && num > 0;
        const searchParts = [
          `name~"${q}"`,
          `cadre~"${q}"`,
          `current_position~"${q}"`,
          `rank~"${q}"`,
          `police_station~"${q}"`,
          `range~"${q}"`,
          `state~"${q}"`,
          `contact_number~"${q}"`,
          `email~"${q}"`,
          `status~"${q}"`
        ];
        if (isNum) {
          searchParts.push(`batch_year = ${num}`);
        }
        parts.push(`(${searchParts.join(" || ")})`);
      }
      const filter = parts.length ? parts.join(" && ") : undefined;

      const records = await pb.collection("ips_officers").getFullList({
        sort: "-created",
        filter,
      });

      const headers = [
        "Officer Name",
        "Batch Year",
        "Cadre",
        "State",
        "Rank",
        "Present Post",
        "Police Station/Range",
        "Official Email",
        "Official Contact",
        "Status"
      ];

      const rows = records.map((r) => [
        r.name || "",
        String(r.batch_year || ""),
        r.cadre || "",
        r.state || "",
        r.rank || "",
        r.current_position || "",
        `${r.police_station || ""}${r.range ? " / " + r.range : ""}`,
        r.email || "",
        r.contact_number || "",
        r.status || ""
      ]);

      const filename = `ips_officers_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "IPS Officers Database", headers, rows, {
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
    setCadreFilter("all");
    setStateFilter("all");
    setStatusFilter("all");
    clearSelection();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IPS Database</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalCount.toLocaleString()} officer{totalCount !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="gradient-button" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add New Officer
            </Button>
            <OfficerFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAdd} isSubmitting={submitting} />
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
                  placeholder="Search by name, position, station, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <SearchableSelect
                  options={cadres.map((c) => ({ label: c, value: c }))}
                  value={cadreFilter === "all" ? undefined : cadreFilter}
                  onValueChange={(value) => setCadreFilter(value || "all")}
                  placeholder="All Cadres"
                  triggerClassName="min-w-[140px]"
                />
                <SearchableSelect
                  options={states.map((s) => ({ label: s, value: s }))}
                  value={stateFilter === "all" ? undefined : stateFilter}
                  onValueChange={(value) => setStateFilter(value || "all")}
                  placeholder="All States"
                  triggerClassName="min-w-[140px]"
                />
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
                <Button variant="outline" onClick={() => fetchOfficers(currentPage, pageSize)}>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            ) : officers.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">No officers found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Showing {startRecord}-{endRecord} of {totalCount.toLocaleString()} officers
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</div>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <OfficerViewModal open={!!viewOfficer} officer={viewOfficer} onOpenChange={(open) => { if (!open) setViewOfficer(null); }} onEdit={() => { if (viewOfficer) { setEditingOfficer(viewOfficer); setViewOfficer(null); } }} />
        <OfficerFormModal open={!!editingOfficer} onOpenChange={(open) => { if (!open) setEditingOfficer(null); }} officer={editingOfficer} onSubmit={handleEdit} isSubmitting={submitting} />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white font-semibold">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {isBulkDelete
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} selected officers? This action cannot be undone.`
                  : "Are you sure you want to permanently delete this officer? This action cannot be undone."}
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
                    await deleteOfficer(deleteId);
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
