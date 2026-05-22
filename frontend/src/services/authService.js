import { apiRequest } from '../lib/apiClient';

export async function loginWithCredentials({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}
