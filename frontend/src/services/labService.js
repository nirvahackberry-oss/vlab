import { apiRequest } from '../lib/apiClient';

export async function fetchLabs() {
  return apiRequest('/labs');
}

export async function fetchSubLabs() {
  return apiRequest('/sub-labs');
}

export async function fetchLabDetails(labId) {
  return apiRequest(`/labs/${labId}`);
}

export async function startLabSession(payload) {
  return apiRequest('/lab-sessions', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchLabSessionStatus(sessionId) {
  return apiRequest(`/lab-sessions/${sessionId}`);
}

export async function fetchUserActiveSession(userId, labId) {
  const t = Date.now();
  const encoded = encodeURIComponent(userId);
  const url = labId
    ? `/lab-sessions/user/${encoded}?labId=${encodeURIComponent(labId)}&t=${t}`
    : `/lab-sessions/user/${encoded}?t=${t}`;
  return apiRequest(url);
}

export async function stopLabSession(sessionId) {
  return apiRequest(`/lab-sessions/${sessionId}/stop`, {
    method: 'POST',
    body: { sessionId },
  });
}

export async function updateLabCredits(labId, credits) {
  return apiRequest(`/labs/${labId}/credits`, {
    method: 'PATCH',
    body: { credits },
  });
}
