import { apiRequest } from '../lib/apiClient';

export async function fetchUsers() {
  return apiRequest('/users');
}

export async function createUser(payload) {
  return apiRequest('/users', {
    method: 'POST',
    body: payload,
  });
}

export async function updateUserStatus(userId, status) {
  return apiRequest(`/users/${userId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
