"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, User, Calendar, CheckCircle, Loader2 } from "lucide-react";
import pb from "@/lib/pocketbase";

export function StatsCards() {
  const [stats, setStats] = useState({
    ias: 0,
    ips: 0,
    meetings: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [iasRes, ipsRes, meetingsRes, eventsRes, completedRes] = await Promise.all([
          pb.collection("ias_officers").getList(1, 1),
          pb.collection("ips_officers").getList(1, 1),
          pb.collection("meetings").getList(1, 1),
          pb.collection("calendar_events").getList(1, 1),
          pb.collection("meetings").getList(1, 1, { filter: 'status = "Completed"' }),
        ]);

        setStats({
          ias: iasRes.totalItems,
          ips: ipsRes.totalItems,
          meetings: meetingsRes.totalItems + eventsRes.totalItems,
          completed: completedRes.totalItems,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statsItems = [
    {
      title: "Total IAS Officers",
      value: loading ? null : stats.ias.toLocaleString(),
      label: "Active Records",
      glowClass: "border-t-2 border-blue-500/80 dark:border-blue-400/80",
      bgGlow: "from-blue-500/5 to-transparent",
      icon: Users,
      iconBg: "bg-gradient-to-br from-blue-500/10 to-blue-500/20 border border-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total IPS Officers",
      value: loading ? null : stats.ips.toLocaleString(),
      label: "Active Records",
      glowClass: "border-t-2 border-emerald-500/80 dark:border-emerald-400/80",
      bgGlow: "from-emerald-500/5 to-transparent",
      icon: User,
      iconBg: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Meetings Tracked",
      value: loading ? null : stats.meetings.toLocaleString(),
      label: "Total Created",
      glowClass: "border-t-2 border-orange-500/80 dark:border-orange-400/80",
      bgGlow: "from-orange-500/5 to-transparent",
      icon: Calendar,
      iconBg: "bg-gradient-to-br from-orange-500/10 to-orange-500/20 border border-orange-500/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Updates Completed",
      value: loading ? null : stats.completed.toLocaleString(),
      label: "Completed Status",
      glowClass: "border-t-2 border-purple-500/80 dark:border-purple-400/80",
      bgGlow: "from-purple-500/5 to-transparent",
      icon: CheckCircle,
      iconBg: "bg-gradient-to-br from-purple-500/10 to-purple-500/20 border border-purple-500/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {statsItems.map((stat) => (
        <Card key={stat.title} className={`glass-premium glass-card-hover overflow-hidden relative border-0 ${stat.glowClass}`}>
          <div className={`absolute inset-0 bg-gradient-to-tr ${stat.bgGlow} pointer-events-none`} />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {stat.title}
                </p>
                {stat.value === null ? (
                  <div className="py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-400">{stat.label}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${stat.iconBg} shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
