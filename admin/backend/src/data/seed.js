import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLES } from "./defaultRoles.js";
import path from "path";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const SEMESTER_ORDER = {
  "Semester 1": 1,
  "Semester 2": 2,
  "Semester 3": 3,
  "Semester 4": 4,
};

async function loadMainUsers() {
  try {
    const mod = await import(
      pathToFileURL(path.join(REPO_ROOT, "backend/data/users.js")).href
    );
    return mod.getUsersInternal?.() || [];
  } catch {
    return [];
  }
}

async function loadMainLabs() {
  try {
    const mod = await import(
      pathToFileURL(path.join(REPO_ROOT, "backend/config/labs.js")).href
    );
    return mod.LABS || [];
  } catch {
    return [];
  }
}

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const formatDate = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
};

/**
 * Build initial platform dataset from main backend config when store is empty.
 */
export async function buildSeedData() {
  const [mainUsers, mainLabs] = await Promise.all([loadMainUsers(), loadMainLabs()]);
  const now = new Date().toISOString();
  const dateStr = formatDate();

  const courseId = "course-mca-001";
  const course = {
    id: courseId,
    code: "MCA",
    title: "Master of Computer Application",
    subtitle: "Master in Computer Application",
    description: "Postgraduate program in computer applications",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const semesterNames = [
    ...new Set(mainLabs.map((l) => l.semester).filter(Boolean)),
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
  ];

  const semesters = [...new Set(semesterNames)]
    .sort((a, b) => (SEMESTER_ORDER[a] || 99) - (SEMESTER_ORDER[b] || 99))
    .map((name) => ({
      id: `sem-${name.toLowerCase().replace(/\s+/g, "-")}`,
      courseId,
      name,
      order: SEMESTER_ORDER[name] || 99,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }));

  const semesterByName = Object.fromEntries(semesters.map((s) => [s.name, s.id]));

  const labs = mainLabs.map((lab) => ({
    id: lab.id,
    courseId,
    semesterId: semesterByName[lab.semester] || semesters[0]?.id,
    title: lab.title,
    subtitle: lab.subtitle || "",
    description: lab.description || "",
    logo: lab.logo || "",
    durationMinutes: lab.durationMinutes || 90,
    credits: lab.credits || 30,
    complexity: lab.complexity || "Beginner",
    category: lab.category || "Programming",
    status: lab.status || "ready",
    taskDefinition: lab.taskDefinition || "",
    createdAt: now,
    updatedAt: now,
  }));

  const users = await Promise.all(
    mainUsers.map(async (u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: await hashPassword(u.password || "password123"),
      role: u.role,
      credits: u.credits ?? 1000,
      status: u.status || "CONFIRMED",
      enabled: u.enabled !== "False",
      courseId: courseId,
      semesterIds: [],
      created: u.created || dateStr,
      updated: u.updated || dateStr,
    })),
  );

  if (users.length === 0) {
    users.push({
      id: "user-admin-001",
      name: "Meet Nayak",
      email: "admin@ignito.com",
      passwordHash: await hashPassword("admin123"),
      role: "Super Admin",
      credits: 10000,
      status: "CONFIRMED",
      enabled: true,
      courseId: null,
      semesterIds: [],
      created: dateStr,
      updated: dateStr,
    });
  }

  const roles = DEFAULT_ROLES.map((r) => ({
    ...r,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    users,
    roles,
    courses: [course],
    semesters,
    labs,
    creditTransactions: [],
    meta: { version: 1, seededAt: now },
  };
}

export { uuidv4, hashPassword, formatDate };
