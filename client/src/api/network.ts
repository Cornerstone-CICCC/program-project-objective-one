import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export const getNetworkPulse = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/network/pulse`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to fetch network pulse.');
    }

    return await res.json();
  } catch (err) {
    console.error('Network pulse error:', err);
    return null;
  }
};
