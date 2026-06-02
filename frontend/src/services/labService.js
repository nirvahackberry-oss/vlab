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

export async function startLabSession({ labId, duration } = {}) {
  if (!labId) {
    throw new Error('labId is required to start a lab session');
  }
  return apiRequest('/lab-sessions', {
    method: 'POST',
    body: { labId, ...(duration ? { duration } : {}) },
  });
}

export async function fetchLabSessionStatus(sessionId) {
  return apiRequest(`/lab-sessions/${sessionId}`);
}

export async function fetchJupyterHealth(sessionId) {
  return apiRequest(`/lab-sessions/${sessionId}/jupyter-health`);
}

/** Poll until ECS task is running and container URL (public IP) is available. */
export async function waitForLabSessionReady(sessionId, options = {}) {
  const { maxAttempts = 90, intervalMs = 2000 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await fetchLabSessionStatus(sessionId);

    if (session.status === 'failed') {
      throw new Error(session.message || 'Lab environment failed to start');
    }

    const toolUrl =
      session.tools?.jupyter?.url ||
      session.tools?.main?.url ||
      null;

    const isJupyter = session.tools?.main?.type === 'jupyter' || session.tools?.jupyter?.enabled;
    const ready =
      session.status === 'running' &&
      (session.publicIp || toolUrl?.startsWith('http') || (isJupyter && toolUrl?.includes('/jupyter')));

    if (ready) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Lab environment timed out while starting. Please try again.');
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
