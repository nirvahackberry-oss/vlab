import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getStore, updateStore } from "../data/store.js";
import { conflict, notFound, badRequest, forbidden } from "../lib/errors.js";
import { formatDate } from "../data/seed.js";
import { getDefaultCreditsForRole, getRoleByName } from "./roleService.js";

const sanitizeUser = ({ passwordHash, ...user }) => user;

function enrichUser(user, state) {
  const course = state.courses.find((c) => c.id === user.courseId);
  const semesters = (user.semesterIds || [])
    .map((id) => state.semesters.find((s) => s.id === id))
    .filter(Boolean);

  return {
    ...sanitizeUser(user),
    courseTitle: course?.title,
    courseCode: course?.code,
    semesterNames: semesters.map((s) => s.name),
  };
}

function resolveEnrollment(state, { courseId, courseCode, semesterIds, semesterNames }) {
  let resolvedCourseId = courseId || null;
  if (!resolvedCourseId && courseCode) {
    const course = state.courses.find(
      (c) => c.code.toLowerCase() === courseCode.trim().toLowerCase(),
    );
    if (course) resolvedCourseId = course.id;
  }

  let resolvedSemesterIds = Array.isArray(semesterIds) ? [...semesterIds] : [];

  if (semesterNames?.length && resolvedCourseId) {
    for (const name of semesterNames) {
      const sem = state.semesters.find(
        (s) =>
          s.courseId === resolvedCourseId &&
          s.name.toLowerCase() === name.trim().toLowerCase(),
      );
      if (sem && !resolvedSemesterIds.includes(sem.id)) {
        resolvedSemesterIds.push(sem.id);
      }
    }
  }

  if (resolvedSemesterIds.length && resolvedCourseId) {
    resolvedSemesterIds = resolvedSemesterIds.filter((id) => {
      const sem = state.semesters.find((s) => s.id === id);
      return sem?.courseId === resolvedCourseId;
    });
  }

  return { courseId: resolvedCourseId, semesterIds: resolvedSemesterIds };
}

async function buildUserRecord(state, payload) {
  const email = payload.email.trim().toLowerCase();
  const existing = state.users.find((u) => u.email.toLowerCase() === email);
  if (existing) throw conflict(`Email already registered: ${email}`);

  const roleName = payload.role || "Student";
  if (!getRoleByName(roleName)) {
    throw badRequest(`Unknown role: ${roleName}`);
  }

  const enrollment = resolveEnrollment(state, payload);
  const dateStr = formatDate();
  const defaultCredits = getDefaultCreditsForRole(roleName);

  return {
    id: `user-${uuidv4().slice(0, 8)}`,
    name: payload.name?.trim() || "New User",
    email,
    passwordHash: await bcrypt.hash(payload.password || "password123", 10),
    role: roleName,
    credits:
      payload.credits !== undefined && payload.credits !== null
        ? Number(payload.credits)
        : defaultCredits,
    status: payload.status || "CONFIRMED",
    enabled: payload.enabled !== false,
    courseId: enrollment.courseId,
    semesterIds: enrollment.semesterIds,
    created: dateStr,
    updated: dateStr,
  };
}

export function listUsers() {
  const state = getStore();
  return state.users.map((u) => enrichUser(u, state));
}

export function getUserById(id) {
  const state = getStore();
  const user = state.users.find((u) => u.id === id);
  if (!user) throw notFound("User not found");
  return enrichUser(user, state);
}

export async function createUser(payload) {
  let created = null;

  await updateStore(async (state) => {
    const user = await buildUserRecord(state, payload);
    state.users.push(user);
    created = enrichUser(user, state);
    return state;
  });

  return created;
}

export async function bulkCreateUsers(rows, options = {}) {
  const defaultRole = options.defaultRole || "Student";
  const defaultCourseId = options.defaultCourseId || null;
  const defaultSemesterIds = options.defaultSemesterIds || [];

  const result = {
    total: rows.length,
    created: 0,
    skipped: 0,
    errors: [],
    users: [],
  };

  const seenInFile = new Set();

  await updateStore(async (state) => {
    for (const row of rows) {
      try {
        const email = row.email.trim().toLowerCase();

        if (seenInFile.has(email)) {
          result.skipped += 1;
          result.errors.push({
            row: row.rowNumber,
            email: row.email,
            message: "Duplicate email in file",
          });
          continue;
        }
        seenInFile.add(email);

        if (state.users.some((u) => u.email.toLowerCase() === email)) {
          result.skipped += 1;
          result.errors.push({
            row: row.rowNumber,
            email: row.email,
            message: "Email already exists in system",
          });
          continue;
        }

        const payload = {
          name: row.name,
          email: row.email,
          password: row.password,
          role: row.role || defaultRole,
          courseCode: row.courseCode,
          courseId: defaultCourseId,
          semesterIds: defaultSemesterIds,
          semesterNames: row.semesterNames,
        };

        const user = await buildUserRecord(state, payload);
        state.users.push(user);
        result.created += 1;
        result.users.push(enrichUser(user, state));
      } catch (err) {
        result.skipped += 1;
        result.errors.push({
          row: row.rowNumber,
          email: row.email,
          message: err.message || "Failed to create user",
        });
      }
    }
    return state;
  });

  return result;
}

export async function updateUser(id, payload) {
  let updated = null;
  const passwordHash = payload.password
    ? await bcrypt.hash(payload.password, 10)
    : null;

  await updateStore((state) => {
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) throw notFound("User not found");

    const user = state.users[idx];
    if (payload.name !== undefined) user.name = payload.name.trim();
    if (payload.email !== undefined) {
      const email = payload.email.trim().toLowerCase();
      const dup = state.users.find(
        (u) => u.id !== id && u.email.toLowerCase() === email,
      );
      if (dup) throw conflict("Email already in use");
      user.email = email;
    }
    if (payload.role !== undefined) {
      if (!getRoleByName(payload.role)) {
        throw badRequest(`Unknown role: ${payload.role}`);
      }
      user.role = payload.role;
    }
    if (payload.credits !== undefined) user.credits = Number(payload.credits);
    if (payload.status !== undefined) user.status = payload.status;
    if (payload.enabled !== undefined) user.enabled = Boolean(payload.enabled);
    if (passwordHash) user.passwordHash = passwordHash;

    if (
      payload.courseId !== undefined ||
      payload.semesterIds !== undefined ||
      payload.courseCode !== undefined
    ) {
      const enrollment = resolveEnrollment(state, {
        courseId: payload.courseId ?? user.courseId,
        courseCode: payload.courseCode,
        semesterIds: payload.semesterIds ?? user.semesterIds,
        semesterNames: payload.semesterNames,
      });
      user.courseId = enrollment.courseId;
      user.semesterIds = enrollment.semesterIds;
    }

    user.updated = formatDate();
    updated = enrichUser(user, state);
    return state;
  });

  return updated;
}

export async function adjustUserCredits(id, amount, meta = {}) {
  let result = null;

  await updateStore((state) => {
    const user = state.users.find((u) => u.id === id);
    if (!user) throw notFound("User not found");

    const delta = Number(amount);
    const nextCredits = Math.max(0, (user.credits || 0) + delta);
    user.credits = nextCredits;
    user.updated = formatDate();

    const tx = {
      id: `tx-${uuidv4().slice(0, 8)}`,
      userId: id,
      userEmail: user.email,
      amount: delta,
      balanceAfter: nextCredits,
      type: delta >= 0 ? "credit" : "debit",
      reason: meta.reason || "Admin adjustment",
      createdBy: meta.createdBy || "system",
      createdAt: new Date().toISOString(),
    };
    state.creditTransactions.unshift(tx);
    result = { user: enrichUser(user, state), transaction: tx };
    return state;
  });

  return result;
}

export async function deleteUser(id, { actorUserId } = {}) {
  if (actorUserId && actorUserId === id) {
    throw forbidden("You cannot delete your own account");
  }

  await updateStore((state) => {
    const user = state.users.find((u) => u.id === id);
    if (!user) throw notFound("User not found");

    if (user.role === "Super Admin") {
      const superAdminCount = state.users.filter((u) => u.role === "Super Admin").length;
      if (superAdminCount <= 1) {
        throw badRequest("Cannot delete the only Super Admin account");
      }
    }

    state.users = state.users.filter((u) => u.id !== id);
    return state;
  });
}

export async function verifyCredentials(email, password) {
  const user = getStore().users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user || !user.enabled) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return enrichUser(user, getStore());
}
