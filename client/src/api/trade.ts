import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export interface IProposeTradePayload {
  receiver_id: string;
  offered_skill_id: string;
  received_skill_id: string;
  message?: string;
  proposed_location?: string;
}

export const proposeTrade = async (payload: IProposeTradePayload) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to propose trade.');
    }

    return await res.json();
  } catch (err) {
    console.error('Propose trade error:', err);
    throw err;
  }
};

export const getMyTrades = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades/me`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return [];

    return await res.json();
  } catch (err) {
    console.error('Fetch my trades error:', err);
    return [];
  }
};

export const getUserTrades = async (userId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades/user/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return [];

    return await res.json();
  } catch (err) {
    console.error('Fetch user trades error:', err);
    return [];
  }
};

export const getTradeById = async (tradeId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades/${tradeId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) throw new Error('Failed to fetch trade details.');

    return await res.json();
  } catch (err) {
    console.error('Fetch trade details error:', err);
    throw err;
  }
};

export const updateTradeStatus = async (
  tradeId: string,
  status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED',
  reason?: string,
) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status, reason }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update trade status.');
    }

    return await res.json();
  } catch (err) {
    console.error('Update trade status error:', err);
    throw err;
  }
};

export const hideTradeConversation = async (tradeId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/hide`, {
      method: 'PUT',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to hide conversation.');
    }

    return await res.json();
  } catch (err) {
    console.error('Hide trade error:', err);
    throw err;
  }
};
