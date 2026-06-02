import { v4 as uuidv4 } from "uuid";
import { getStore, updateStore } from "../data/store.js";
import { conflict, notFound } from "../lib/errors.js";

export function listSemesters({ courseId } = {}) {
  const { semesters, labs } = getStore();
  return semesters
    .filter((s) => !courseId || s.courseId === courseId)
    .map((semester) => {
      const semesterLabs = labs.filter((l) => l.semesterId === semester.id);
      return {
        ...semester,
        labCount: semesterLabs.length,
        totalCredits: semesterLabs.reduce((sum, l) => sum + (l.credits || 0), 0),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getSemesterById(id) {
  const semester = getStore().semesters.find((s) => s.id === id);
  if (!semester) throw notFound("Semester not found");
  const labs = getStore().labs.filter((l) => l.semesterId === id);
  const course = getStore().courses.find((c) => c.id === semester.courseId);
  return { ...semester, course, labs };
}

export async function createSemester(payload) {
  const course = getStore().courses.find((c) => c.id === payload.courseId);
  if (!course) throw notFound("Course not found");

  const now = new Date().toISOString();
  const semester = {
    id: `sem-${uuidv4().slice(0, 8)}`,
    courseId: payload.courseId,
    name: payload.name.trim(),
    order: Number(payload.order) || 1,
    status: payload.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((state) => {
    state.semesters.push(semester);
    return state;
  });

  return semester;
}

export async function updateSemester(id, payload) {
  let updated = null;

  await updateStore((state) => {
    const semester = state.semesters.find((s) => s.id === id);
    if (!semester) throw notFound("Semester not found");

    if (payload.name !== undefined) semester.name = payload.name.trim();
    if (payload.order !== undefined) semester.order = Number(payload.order);
    if (payload.status !== undefined) semester.status = payload.status;
    if (payload.courseId !== undefined) {
      const course = state.courses.find((c) => c.id === payload.courseId);
      if (!course) throw notFound("Course not found");
      semester.courseId = payload.courseId;
    }
    semester.updatedAt = new Date().toISOString();
    updated = { ...semester };
    return state;
  });

  return updated;
}

export async function deleteSemester(id) {
  await updateStore((state) => {
    const semester = state.semesters.find((s) => s.id === id);
    if (!semester) throw notFound("Semester not found");

    const hasLabs = state.labs.some((l) => l.semesterId === id);
    if (hasLabs) throw conflict("Remove labs before deleting this semester");

    state.semesters = state.semesters.filter((s) => s.id !== id);
    return state;
  });
}
