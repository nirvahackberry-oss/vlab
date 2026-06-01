import { v4 as uuidv4 } from "uuid";
import { getStore, updateStore } from "../data/store.js";
import { conflict, notFound } from "../lib/errors.js";

export function listCourses() {
  const { courses, semesters, labs } = getStore();
  return courses.map((course) => {
    const courseSemesters = semesters.filter((s) => s.courseId === course.id);
    const courseLabs = labs.filter((l) => l.courseId === course.id);
    return {
      ...course,
      semesterCount: courseSemesters.length,
      labCount: courseLabs.length,
      totalCredits: courseLabs.reduce((sum, l) => sum + (l.credits || 0), 0),
    };
  });
}

export function getCourseById(id) {
  const course = getStore().courses.find((c) => c.id === id);
  if (!course) throw notFound("Course not found");
  const semesters = getStore().semesters.filter((s) => s.courseId === id);
  const labs = getStore().labs.filter((l) => l.courseId === id);
  return { ...course, semesters, labs };
}

export async function createCourse(payload) {
  const code = payload.code.trim().toUpperCase();
  const dup = getStore().courses.find((c) => c.code.toUpperCase() === code);
  if (dup) throw conflict("Course code already exists");

  const now = new Date().toISOString();
  const course = {
    id: `course-${uuidv4().slice(0, 8)}`,
    code,
    title: payload.title.trim(),
    subtitle: payload.subtitle?.trim() || "",
    description: payload.description?.trim() || "",
    status: payload.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((state) => {
    state.courses.push(course);
    return state;
  });

  return course;
}

export async function updateCourse(id, payload) {
  let updated = null;

  await updateStore((state) => {
    const course = state.courses.find((c) => c.id === id);
    if (!course) throw notFound("Course not found");

    if (payload.code) {
      const code = payload.code.trim().toUpperCase();
      const dup = state.courses.find(
        (c) => c.id !== id && c.code.toUpperCase() === code,
      );
      if (dup) throw conflict("Course code already exists");
      course.code = code;
    }
    if (payload.title !== undefined) course.title = payload.title.trim();
    if (payload.subtitle !== undefined) course.subtitle = payload.subtitle.trim();
    if (payload.description !== undefined) {
      course.description = payload.description.trim();
    }
    if (payload.status !== undefined) course.status = payload.status;
    course.updatedAt = new Date().toISOString();
    updated = { ...course };
    return state;
  });

  return updated;
}

export async function deleteCourse(id) {
  await updateStore((state) => {
    const course = state.courses.find((c) => c.id === id);
    if (!course) throw notFound("Course not found");

    const hasLabs = state.labs.some((l) => l.courseId === id);
    if (hasLabs) {
      throw conflict("Remove labs before deleting this course");
    }

    state.courses = state.courses.filter((c) => c.id !== id);
    state.semesters = state.semesters.filter((s) => s.courseId !== id);
    return state;
  });
}
