import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export interface IBulkSkillPayload {
  skill_id: string;
  type: 'TEACH' | 'LEARN';
}

export const addBulkUserSkills = async (skills: IBulkSkillPayload[]): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ skills }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to add bulk skills:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Bulk add skills network error:', err);
    return false;
  }
};

export const getMySkills = async (): Promise<any[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills/me`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return [];

    return await res.json();
  } catch (err) {
    console.error('Fetch my skills error:', err);
    return [];
  }
};

export const getUserSkills = async (userId: string): Promise<any[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills/user/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      console.error(`Failed to fetch skills for user: ${userId}`);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.error('Fetch specific user skills error:', err);
    return [];
  }
};

export const addUserSkill = async (payload: {
  skill_id: string;
  type: 'TEACH' | 'LEARN';
  proficiency?: string;
  description?: string;
}) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to add skill');
    }

    return await res.json();
  } catch (err) {
    console.error('Add user skill error:', err);
    throw err;
  }
};

export const updateUserSkill = async (
  userSkillId: string,
  updates: { proficiency?: string; description?: string },
) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills/${userSkillId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update skill details');
    }

    return await res.json();
  } catch (err) {
    console.error('Update user skill error:', err);
    throw err;
  }
};

export const deleteUserSkill = async (userSkillId: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/user-skills/${userSkillId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      console.error(`Failed to delete user skill: ${userSkillId}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete user skill error:', err);
    return false;
  }
};
