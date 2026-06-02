import { apiRequest } from '../lib/apiClient';

export async function fetchInstances() {
  return apiRequest('/compute/instances');
}

export async function fetchInstanceCatalog() {
  return apiRequest('/compute/catalog');
}

export async function createInstance(payload) {
  return apiRequest('/compute/instances', {
    method: 'POST',
    body: payload,
  });
}
