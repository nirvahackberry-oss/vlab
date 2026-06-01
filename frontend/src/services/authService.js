// import { apiRequest } from '../lib/apiClient';

// export async function loginWithCredentials({ email, password }) {
//   return apiRequest('/auth/login', {
//     method: 'POST',
//     auth: false,
//     body: { email, password },
//   });
// }

import { apiRequest } from '../lib/apiClient';

export const loginWithCredentials = async ({ email, password }) => {
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: {
        email,
        password,
      },
    });

    console.log('LOGIN RESPONSE:', data);

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    throw err;
  }
};