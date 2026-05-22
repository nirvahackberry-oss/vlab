const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

let rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// If we are accessing via IP (not localhost), update the API URL to use that same IP
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && rawApiBaseUrl.includes('localhost')) {
  rawApiBaseUrl = rawApiBaseUrl.replace('localhost', window.location.hostname);
}

// Sensible dev fallback: if no VITE_API_BASE_URL is provided, assume backend on :8080 under /api.
// This prevents fetches from accidentally hitting the Vite dev server (:3000) as relative paths.
if (typeof window !== 'undefined' && !rawApiBaseUrl) {
  rawApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8080/api`;
}

export const APP_ENV = {
  apiBaseUrl: rawApiBaseUrl ? trimTrailingSlash(rawApiBaseUrl) : '',
  appName: import.meta.env.VITE_APP_NAME || 'Vlab',
};

export const buildApiUrl = (path) => {
  if (!APP_ENV.apiBaseUrl) {
    return path;
  }

  return `${APP_ENV.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
