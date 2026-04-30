import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export interface UpdateLocationPayload {
  lat: number;
  lng: number;
  city: string;
  province: string;
  country: string;
  address?: string;
}

export const updateUserLocation = async (payload: UpdateLocationPayload) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/locations/update`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to update location:', error.message);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Network error updating location:', err);
    return null;
  }
};
