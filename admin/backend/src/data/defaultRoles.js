export const DEFAULT_ROLES = [
  {
    id: "role-super-admin",
    name: "Super Admin",
    defaultCredits: 10000,
    description: "Full platform access",
    isSystem: true,
  },
  {
    id: "role-tenant-admin",
    name: "Tenant Admin",
    defaultCredits: 5000,
    description: "Organization administrator",
    isSystem: true,
  },
  {
    id: "role-tenant-user",
    name: "Tenant User",
    defaultCredits: 1000,
    description: "Standard tenant member",
    isSystem: true,
  },
  {
    id: "role-student",
    name: "Student",
    defaultCredits: 1000,
    description: "Enrolled student account",
    isSystem: true,
  },
];

export function ensureRolesInState(state) {
  if (!state.roles?.length) {
    state.roles = DEFAULT_ROLES.map((r) => ({
      ...r,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
  return state;
}

export function migrateUsers(state) {
  for (const user of state.users) {
    if (user.courseId === undefined) user.courseId = null;
    if (!Array.isArray(user.semesterIds)) user.semesterIds = [];
  }
  return state;
}
