import { apiRequest } from "../api/client.js";
import { downloadBlob, uploadFile } from "../api/upload.js";

export const fetchDashboardStats = () =>
  apiRequest("/dashboard/stats").then((r) => r.stats);

export const fetchUsers = () => apiRequest("/users").then((r) => r.users);

export const fetchUser = (id) => apiRequest(`/users/${id}`).then((r) => r.user);

export const createUser = (body) =>
  apiRequest("/users", { method: "POST", body }).then((r) => r.user);

export const updateUser = (id, body) =>
  apiRequest(`/users/${id}`, { method: "PATCH", body }).then((r) => r.user);

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, { method: "DELETE" });

export const adjustUserCredits = (id, body) =>
  apiRequest(`/users/${id}/credits`, { method: "PATCH", body });

export const fetchCourses = () => apiRequest("/courses").then((r) => r.courses);

export const fetchCourse = (id) =>
  apiRequest(`/courses/${id}`).then((r) => r.course);

export const createCourse = (body) =>
  apiRequest("/courses", { method: "POST", body }).then((r) => r.course);

export const updateCourse = (id, body) =>
  apiRequest(`/courses/${id}`, { method: "PATCH", body }).then((r) => r.course);

export const deleteCourse = (id) =>
  apiRequest(`/courses/${id}`, { method: "DELETE" });

export const fetchSemesters = (courseId) => {
  const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiRequest(`/semesters${qs}`).then((r) => r.semesters);
};

export const createSemester = (body) =>
  apiRequest("/semesters", { method: "POST", body }).then((r) => r.semester);

export const updateSemester = (id, body) =>
  apiRequest(`/semesters/${id}`, { method: "PATCH", body }).then((r) => r.semester);

export const deleteSemester = (id) =>
  apiRequest(`/semesters/${id}`, { method: "DELETE" });

export const fetchLabs = (params = {}) => {
  const search = new URLSearchParams();
  if (params.courseId) search.set("courseId", params.courseId);
  if (params.semesterId) search.set("semesterId", params.semesterId);
  const qs = search.toString() ? `?${search}` : "";
  return apiRequest(`/labs${qs}`).then((r) => r.labs);
};

export const createLab = (body) =>
  apiRequest("/labs", { method: "POST", body }).then((r) => r.lab);

export const updateLab = (id, body) =>
  apiRequest(`/labs/${id}`, { method: "PATCH", body }).then((r) => r.lab);

export const deleteLab = (id) => apiRequest(`/labs/${id}`, { method: "DELETE" });

export const fetchRoles = () => apiRequest("/roles").then((r) => r.roles);

export const createRole = (body) =>
  apiRequest("/roles", { method: "POST", body }).then((r) => r.role);

export const updateRole = (id, body) =>
  apiRequest(`/roles/${id}`, { method: "PATCH", body }).then((r) => r.role);

export const deleteRole = (id) => apiRequest(`/roles/${id}`, { method: "DELETE" });

export const downloadBulkUserTemplate = () =>
  downloadBlob("/users/bulk-template", "student-import-template.xlsx");

export const bulkUploadUsers = (file, options = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("options", JSON.stringify(options));
  return uploadFile("/users/bulk-upload", formData);
};

export const fetchCreditTransactions = (params = {}) => {
  const search = new URLSearchParams();
  if (params.userId) search.set("userId", params.userId);
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString() ? `?${search}` : "";
  return apiRequest(`/credits/transactions${qs}`).then((r) => r.transactions);
};
