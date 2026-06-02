import { buildApiUrl } from "../config/env.js";
import { getStoredSession } from "./client.js";

export async function uploadFile(path, formData) {
  const token = getStoredSession()?.token;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `Upload failed (${response.status})`);
  }

  return data;
}

export async function downloadBlob(path, filename) {
  const token = getStoredSession()?.token;
  const headers = { Accept: "*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildApiUrl(path), { headers });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
