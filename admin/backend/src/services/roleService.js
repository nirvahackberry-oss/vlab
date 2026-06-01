import { v4 as uuidv4 } from "uuid";
import { getStore, updateStore } from "../data/store.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";

export function listRoles() {
  const { roles, users } = getStore();
  return roles.map((role) => ({
    ...role,
    userCount: users.filter((u) => u.role === role.name).length,
  }));
}

export function getRoleById(id) {
  const role = getStore().roles.find((r) => r.id === id);
  if (!role) throw notFound("Role not found");
  return role;
}

export function getRoleByName(name) {
  return getStore().roles.find((r) => r.name === name);
}

export function getDefaultCreditsForRole(roleName) {
  const role = getRoleByName(roleName);
  return role?.defaultCredits ?? 1000;
}

export async function createRole(payload) {
  const name = payload.name.trim();
  if (getRoleByName(name)) throw conflict("Role name already exists");

  const now = new Date().toISOString();
  const role = {
    id: `role-${uuidv4().slice(0, 8)}`,
    name,
    defaultCredits: Number(payload.defaultCredits) || 1000,
    description: payload.description?.trim() || "",
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((state) => {
    state.roles.push(role);
    return state;
  });

  return role;
}

export async function updateRole(id, payload) {
  let updated = null;

  await updateStore((state) => {
    const role = state.roles.find((r) => r.id === id);
    if (!role) throw notFound("Role not found");

    if (payload.name !== undefined && !role.isSystem) {
      const name = payload.name.trim();
      const dup = state.roles.find((r) => r.id !== id && r.name === name);
      if (dup) throw conflict("Role name already exists");
      const oldName = role.name;
      role.name = name;
      state.users.forEach((u) => {
        if (u.role === oldName) u.role = name;
      });
    }

    if (payload.defaultCredits !== undefined) {
      role.defaultCredits = Number(payload.defaultCredits);
    }
    if (payload.description !== undefined) {
      role.description = payload.description.trim();
    }
    role.updatedAt = new Date().toISOString();
    updated = { ...role };
    return state;
  });

  return updated;
}

export async function deleteRole(id) {
  await updateStore((state) => {
    const role = state.roles.find((r) => r.id === id);
    if (!role) throw notFound("Role not found");
    if (role.isSystem) throw badRequest("System roles cannot be deleted");

    const inUse = state.users.some((u) => u.role === role.name);
    if (inUse) throw conflict("Reassign users before deleting this role");

    state.roles = state.roles.filter((r) => r.id !== id);
    return state;
  });
}
