"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import pb from "@/lib/pocketbase";
import { Search, Loader2, RefreshCcw } from "lucide-react";

interface OfficerResult {
  id: string;
  name: string;
  batch_year: number;
  cadre: string;
  current_position: string;
  department: string;
  state: string;
  email: string;
  status: "Active" | "Inactive" | "Suspended";
  officerType: "IAS" | "IPS";
}

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

function SearchContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams?.get("q") || "";

  const [officers, setOfficers] = useState<OfficerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filters
  const [searchInput, setSearchInput] = useState(qParam);
  const [cadreFilter, setCadreFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  const [debouncedSearch] = useDebounce(searchInput, 500);

  // Fetch officers on mount and when filters change
  useEffect(() => {
    fetchOfficers();
  }, [debouncedSearch, cadreFilter, stateFilter, statusFilter, sortBy]);

  const fetchOfficers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseParts: string[] = [];

      // Cadre filter
      if (cadreFilter !== "all") {
        baseParts.push(`cadre = "${cadreFilter}"`);
      }

      // State filter
      if (stateFilter !== "all") {
        baseParts.push(`state = "${stateFilter}"`);
      }

      // Status filter
      if (statusFilter !== "all") {
        baseParts.push(`status = "${statusFilter}"`);
      }

      // Sort query parameter
      let sort = "-created";
      if (sortBy === "name") sort = "name";
      else if (sortBy === "batch_year") sort = "-batch_year";

      let iasFilter = undefined;
      let ipsFilter = undefined;

      if (debouncedSearch) {
        const q = debouncedSearch;
        const num = Number(q);
        const isNum = !isNaN(num) && num > 0;

        // IAS Search parts
        const iasSearchParts = [
          `officer_id~"${q}"`,
          `name~"${q}"`,
          `cadre~"${q}"`,
          `current_position~"${q}"`,
          `department~"${q}"`,
          `state~"${q}"`,
          `contact_number~"${q}"`,
          `email~"${q}"`,
          `qualification~"${q}"`,
          `address~"${q}"`,
          `domicile~"${q}"`,
          `pay_level~"${q}"`,
          `central_deputation~"${q}"`,
          `twitter_x~"${q}"`,
          `linkedin~"${q}"`,
          `instagram~"${q}"`,
          `mobile_no~"${q}"`,
          `remarks~"${q}"`,
          `status~"${q}"`
        ];
        if (isNum) iasSearchParts.push(`batch_year = ${num}`);
        const iasSearchFilter = `(${iasSearchParts.join(" || ")})`;
        iasFilter = baseParts.length ? `${baseParts.join(" && ")} && ${iasSearchFilter}` : iasSearchFilter;

        // IPS Search parts
        const ipsSearchParts = [
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
        if (isNum) ipsSearchParts.push(`batch_year = ${num}`);
        const ipsSearchFilter = `(${ipsSearchParts.join(" || ")})`;
        ipsFilter = baseParts.length ? `${baseParts.join(" && ")} && ${ipsSearchFilter}` : ipsSearchFilter;
      } else {
        const baseFilter = baseParts.length ? baseParts.join(" && ") : undefined;
        iasFilter = baseFilter;
        ipsFilter = baseFilter;
      }

      // Fetch from both collections in parallel
      const [iasRes, ipsRes] = await Promise.all([
        pb.collection("ias_officers").getList(1, 100, { filter: iasFilter, sort }).catch(() => ({ items: [], totalItems: 0 })),
        pb.collection("ips_officers").getList(1, 100, { filter: ipsFilter, sort }).catch(() => ({ items: [], totalItems: 0 })),
      ]);

      const iasMapped: OfficerResult[] = iasRes.items.map((record) => ({
        id: record.id,
        name: record.name || "",
        batch_year: record.batch_year || 0,
        cadre: record.cadre || "",
        current_position: record.current_position || "",
        department: record.department || "",
        state: record.state || "",
        email: record.email || "",
        status: record.status as any || "Active",
        officerType: "IAS",
      }));

      const ipsMapped: OfficerResult[] = ipsRes.items.map((record) => ({
        id: record.id,
        name: record.name || "",
        batch_year: record.batch_year || 0,
        cadre: record.cadre || "",
        current_position: record.current_position || "",
        department: record.department || "",
        state: record.state || "",
        email: record.email || "",
        status: record.status as any || "Active",
        officerType: "IPS",
      }));

      let combined = [...iasMapped, ...ipsMapped];

      // Client-side sorting for merged list
      if (sortBy === "name") {
        combined.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "batch_year") {
        combined.sort((a, b) => b.batch_year - a.batch_year);
      }

      setOfficers(combined);
      setTotalCount(iasRes.totalItems + ipsRes.totalItems);
      setIsLoading(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch officers";
      console.error("Failed to fetch officers:", error);
      setError(message);
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setCadreFilter("all");
    setStateFilter("all");
    setStatusFilter("all");
    setSortBy("relevance");
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

  return (
    <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Officers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalCount} result{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, position, email, department..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Select value={cadreFilter} onValueChange={(value) => value !== null && setCadreFilter(value)}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {cadreFilter === "all" ? "All Cadres" : (cadreFilter || "Cadre")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cadres</SelectItem>
                    {ALL_CADRES.map((cadre) => (
                      <SelectItem key={cadre} value={cadre}>
                        {cadre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stateFilter} onValueChange={(value) => value !== null && setStateFilter(value)}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {stateFilter === "all" ? "All States" : (stateFilter || "State")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {ALL_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => value !== null && setStatusFilter(value)}>
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
                <Select value={sortBy} onValueChange={(value) => value !== null && setSortBy(value)}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="batch_year">Batch Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchOfficers}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : officers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No officers found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officers.map((officer) => (
              <Card
                key={`${officer.officerType}-${officer.id}`}
                className="glass-card border-0 hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Officer Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                        officer.officerType === "IAS" ? "from-orange-400 to-red-500" : "from-blue-400 to-indigo-600"
                      } flex items-center justify-center text-white font-semibold text-sm`}>
                        {officer.name.charAt(0)}
                      </div>
                    </div>

                    {/* Officer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {officer.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {officer.officerType === "IAS" ? "Indian Administrative Service" : "Indian Police Service"}
                      </p>

                      <div className="space-y-1 text-xs">
                        <p className="text-slate-700 dark:text-slate-300">
                          {officer.current_position}
                        </p>
                        <p className="text-slate-500">
                          {officer.cadre} | {officer.state}
                        </p>
                        <p className="text-slate-500 truncate">{officer.email}</p>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className={`${getStatusClasses(officer.status)} text-[10px]`}>
                          {officer.status}
                        </Badge>
                        <Badge className={`${
                          officer.officerType === "IAS" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        } text-[10px]`}>
                          {officer.officerType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}

export default function SearchOfficersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </DashboardLayout>
  );
}