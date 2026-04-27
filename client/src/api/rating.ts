import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export interface IRatingPayload {
  trade_id: string;
  score: number;
  comment?: string;
}

export const submitRating = async (payload: IRatingPayload) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to submit rating.');
    }

    return await res.json();
  } catch (err) {
    console.error('Submit rating error:', err);
    throw err;
  }
};

export const checkReviewStatus = async (tradeId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ratings/check/${tradeId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return { hasReviewed: false };

    return await res.json();
  } catch (err) {
    console.error('Check review status error:', err);
    return { hasReviewed: false };
  }
};

export const updateRating = async (
  ratingId: string,
  payload: { score: number; comment?: string },
) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ratings/${ratingId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update rating.');
    }

    return await res.json();
  } catch (err) {
    console.error('Update rating error:', err);
    throw err;
  }
};

export const deleteRating = async (ratingId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ratings/${ratingId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete rating.');
    }

    return await res.json();
  } catch (err) {
    console.error('Delete rating error:', err);
    throw err;
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/ratings/user/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch user reviews.');
    }

    return await res.json();
  } catch (err) {
    console.error('Get user reviews error:', err);
    throw err;
  }
};
