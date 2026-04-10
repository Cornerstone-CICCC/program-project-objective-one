import { BASE_URL } from '.';
import { getAuthHeaders, IUser } from './auth';

export interface IAIMatchUser extends IUser {
  aiMatchScore: number;
  aiReason: string;
}

export const getAIMatches = async (): Promise<IAIMatchUser[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ai/matches`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to fetch AI matches:', error.message);
      throw new Error(error.message || 'Failed to fetch AI matches.');
    }

    const data: IAIMatchUser[] = await res.json();
    return data;
  } catch (err) {
    console.error('Network error in getAIMatches:', err);
    throw err;
  }
};
