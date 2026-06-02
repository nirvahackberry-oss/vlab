import { getStore } from "../data/store.js";

export function getDashboardStats() {
  const { users, roles, courses, semesters, labs, creditTransactions } = getStore();

  const activeLabs = labs.filter((l) => l.status !== "inactive").length;
  const totalLabCredits = labs.reduce((sum, l) => sum + (l.credits || 0), 0);
  const totalUserCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const activeUsers = users.filter((u) => u.enabled).length;

  return {
    totalUsers: users.length,
    totalRoles: roles?.length ?? 0,
    activeUsers,
    totalCourses: courses.length,
    totalSemesters: semesters.length,
    totalLabs: labs.length,
    activeLabs,
    totalLabCredits,
    totalUserCredits,
    totalTransactions: creditTransactions.length,
    recentTransactions: creditTransactions.slice(0, 10),
  };
}
