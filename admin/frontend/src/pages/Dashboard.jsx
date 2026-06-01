import { useEffect, useState } from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";
import {
  MdAccountBalanceWallet,
  MdLayers,
  MdPeople,
  MdSchool,
  MdScience,
  MdReceiptLong,
  MdAdminPanelSettings,
} from "react-icons/md";
import StatCard from "../components/StatCard";
import NavModuleCard from "../components/NavModuleCard";
import { fetchDashboardStats } from "../services/adminApi";

const MODULE_CARDS = [
  {
    key: "users",
    label: "Users",
    path: "/users",
    icon: MdPeople,
    accent: "blue",
    stat: (s) => s.totalUsers,
    sub: (s) => `${s.activeUsers} active`,
    description: "Manage accounts, roles, and access control",
  },
  {
    key: "roles",
    label: "Roles",
    path: "/roles",
    icon: MdAdminPanelSettings,
    accent: "slate",
    stat: (s) => s.totalRoles ?? 0,
    description: "Default credits and permissions per role",
  },
  {
    key: "courses",
    label: "Courses",
    path: "/courses",
    icon: MdSchool,
    accent: "emerald",
    stat: (s) => s.totalCourses,
    description: "Academic programs and course catalog",
  },
  {
    key: "semesters",
    label: "Semesters",
    path: "/semesters",
    icon: MdLayers,
    accent: "violet",
    stat: (s) => s.totalSemesters,
    description: "Terms and semester structure per course",
  },
  {
    key: "labs",
    label: "Labs",
    path: "/labs",
    icon: MdScience,
    accent: "red",
    stat: (s) => s.totalLabs,
    sub: (s) => `${s.activeLabs} active`,
    description: "Lab environments, duration, and pricing",
  },
  {
    key: "credits",
    label: "Credits",
    path: "/credits",
    icon: MdAccountBalanceWallet,
    accent: "orange",
    stat: (s) => s.totalUserCredits,
    sub: (s) => `${s.totalLabCredits} lab cost total`,
    description: "User wallets and lab credit pricing",
  },
  {
    key: "transactions",
    label: "Transactions",
    path: "/transactions",
    icon: MdReceiptLong,
    accent: "slate",
    stat: (s) => s.totalTransactions ?? 0,
    description: "Audit credit adjustments and wallet history",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Typography className="text-slate-500 font-medium">Loading dashboard…</Typography>;
  }

  return (
    <Box className="space-y-8">
      <div>
        <Typography className="text-2xl font-black text-slate-900">Platform overview</Typography>
        <Typography className="text-sm text-slate-500 mt-1">
          Quick stats and navigation to all admin modules
        </Typography>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={MdPeople} accent="blue" />
        <StatCard label="Total Courses" value={stats.totalCourses} icon={MdSchool} accent="emerald" />
        <StatCard label="Total Labs" value={stats.totalLabs} icon={MdScience} accent="red" />
        <StatCard
          label="Lab Credit Pool"
          value={stats.totalLabCredits}
          icon={MdAccountBalanceWallet}
          accent="orange"
        />
      </div>

      <div>
        <Typography className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          Manage modules
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CARDS.map((mod) => (
            <NavModuleCard
              key={mod.key}
              label={mod.label}
              path={mod.path}
              icon={mod.icon}
              accent={mod.accent}
              value={mod.stat(stats)}
              subValue={mod.sub?.(stats)}
              description={mod.description}
            />
          ))}
        </div>
      </div>

      <Paper elevation={0} className="p-6 rounded-2xl border border-slate-200">
        <Typography className="text-lg font-black text-slate-900 mb-4">
          Recent credit activity
        </Typography>
        {stats.recentTransactions?.length === 0 ? (
          <Typography className="text-sm text-slate-500">
            No transactions yet. Adjust credits from Credits or open Transactions.
          </Typography>
        ) : (
          <div className="space-y-2">
            {stats.recentTransactions.map((tx) => (
              <Box
                key={tx.id}
                className="flex items-center justify-between py-3 px-3 rounded-xl bg-slate-50"
              >
                <div>
                  <Typography className="text-sm font-bold text-slate-800">
                    {tx.userEmail}
                  </Typography>
                  <Typography className="text-xs text-slate-500">{tx.reason}</Typography>
                </div>
                <Typography
                  className={`text-sm font-black ${
                    tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </Typography>
              </Box>
            ))}
          </div>
        )}
      </Paper>
    </Box>
  );
}
