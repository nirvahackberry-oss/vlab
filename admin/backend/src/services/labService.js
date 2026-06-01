import { v4 as uuidv4 } from "uuid";
import { getStore, updateStore } from "../data/store.js";
import { conflict, notFound } from "../lib/errors.js";

const enrichLab = (lab, state) => {
  const semester = state.semesters.find((s) => s.id === lab.semesterId);
  const course = state.courses.find((c) => c.id === lab.courseId);
  return {
    ...lab,
    semesterName: semester?.name,
    courseTitle: course?.title,
    courseCode: course?.code,
  };
};

export function listLabs({ courseId, semesterId } = {}) {
  const state = getStore();
  return state.labs
    .filter((l) => (!courseId || l.courseId === courseId) && (!semesterId || l.semesterId === semesterId))
    .map((l) => enrichLab(l, state));
}

export function getLabById(id) {
  const state = getStore();
  const lab = state.labs.find((l) => l.id === id);
  if (!lab) throw notFound("Lab not found");
  return enrichLab(lab, state);
}

export async function createLab(payload) {
  const state = getStore();
  const semester = state.semesters.find((s) => s.id === payload.semesterId);
  if (!semester) throw notFound("Semester not found");

  const now = new Date().toISOString();
  const lab = {
    id: payload.id?.trim() || `lab-${uuidv4().slice(0, 8)}`,
    courseId: semester.courseId,
    semesterId: payload.semesterId,
    title: payload.title.trim(),
    subtitle: payload.subtitle?.trim() || "",
    description: payload.description?.trim() || "",
    logo: payload.logo?.trim() || "",
    durationMinutes: Number(payload.durationMinutes) || 90,
    credits: Number(payload.credits) || 30,
    complexity: payload.complexity || "Beginner",
    category: payload.category || "Programming",
    status: payload.status || "ready",
    taskDefinition: payload.taskDefinition?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  if (state.labs.some((l) => l.id === lab.id)) {
    throw conflict("Lab id already exists");
  }

  await updateStore((s) => {
    s.labs.push(lab);
    return s;
  });

  return enrichLab(lab, getStore());
}

export async function updateLab(id, payload) {
  let updated = null;

  await updateStore((state) => {
    const lab = state.labs.find((l) => l.id === id);
    if (!lab) throw notFound("Lab not found");

    if (payload.semesterId !== undefined) {
      const semester = state.semesters.find((s) => s.id === payload.semesterId);
      if (!semester) throw notFound("Semester not found");
      lab.semesterId = payload.semesterId;
      lab.courseId = semester.courseId;
    }

    const fields = [
      "title",
      "subtitle",
      "description",
      "logo",
      "complexity",
      "category",
      "status",
      "taskDefinition",
    ];
    for (const field of fields) {
      if (payload[field] !== undefined) {
        lab[field] = typeof payload[field] === "string" ? payload[field].trim() : payload[field];
      }
    }
    if (payload.durationMinutes !== undefined) {
      lab.durationMinutes = Number(payload.durationMinutes);
    }
    if (payload.credits !== undefined) {
      lab.credits = Number(payload.credits);
    }
    lab.updatedAt = new Date().toISOString();
    updated = enrichLab(lab, state);
    return state;
  });

  return updated;
}

export async function deleteLab(id) {
  await updateStore((state) => {
    const exists = state.labs.some((l) => l.id === id);
    if (!exists) throw notFound("Lab not found");
    state.labs = state.labs.filter((l) => l.id !== id);
    return state;
  });
}
