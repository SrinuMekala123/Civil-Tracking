"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

export function OfficerDatabase() {
  const [counts, setCounts] = useState({ ias: 0, ips: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [iasRes, ipsRes] = await Promise.all([
          pb.collection("ias_officers").getList(1, 1),
          pb.collection("ips_officers").getList(1, 1),
        ]);
        setCounts({
          ias: iasRes.totalItems,
          ips: ipsRes.totalItems,
        });
      } catch (error) {
        console.error("Failed to load officer counts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <Card className="glass-card border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  counts.ias.toLocaleString()
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Officers</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">IAS</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2 font-hindi" lang="hi">सत्यमेव जयते</p>
          <Link href="/ias-database">
            <Button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
              View IAS Database
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  counts.ips.toLocaleString()
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Officers</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">IPS</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
              <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2 font-hindi" lang="hi">सत्यमेव जयते</p>
          <Link href="/ips-database">
            <Button className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md">
              View IPS Database
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
