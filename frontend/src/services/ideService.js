import { apiRequest } from '../lib/apiClient';

export async function fetchFiles(sessionId) {
  return apiRequest('/files', {
    headers: { 'x-session-id': sessionId }
  });
}

export async function fetchFileContent(path, sessionId) {
  return apiRequest(`/files/content?path=${encodeURIComponent(path)}`, {
    headers: { 'x-session-id': sessionId }
  });
}

export async function saveFile(payload, sessionId) {
  return apiRequest('/save', {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: payload,
  });
}

export async function runFile(payload, sessionId) {
  return apiRequest('/run', {
    method: 'POST',
    headers: { 'x-session-id': sessionId },
    body: payload,
  });
}

export async function deleteFile(path, sessionId) {
  return apiRequest(`/files?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: { 'x-session-id': sessionId },
  });
}

export function connectTerminalStream({ sessionId, runId, onMessage }) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use current window host (with port 8080) for websocket
  const host = `${window.location.hostname}:8080`; 
  const socket = new WebSocket(`${protocol}//${host}/ws/terminal?sessionId=${encodeURIComponent(sessionId)}&runId=${encodeURIComponent(runId || '')}`);

  socket.onmessage = (event) => {
    try {
      onMessage?.(JSON.parse(event.data));
    } catch {
      onMessage?.({ type: 'stdout', data: event.data });
    }
  };

  return socket;
}
