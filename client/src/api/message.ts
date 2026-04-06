import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export const getConversations = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch conversations.');
    }

    return await res.json();
  } catch (err) {
    console.error('Get conversations error:', err);
    throw err;
  }
};

export const getTradeMessages = async (tradeId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages/${tradeId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch messages.');
    }

    return await res.json();
  } catch (err) {
    console.error('Get trade messages error:', err);
    throw err;
  }
};

export const sendMessage = async (tradeId: string, content: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trade_id: tradeId,
        content,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send message.');
    }

    return await res.json();
  } catch (err) {
    console.error('Send message error:', err);
    throw err;
  }
};

export const markMessagesAsRead = async (tradeId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages/${tradeId}/read`, {
      method: 'PUT',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to mark messages as read.');
    }

    return await res.json();
  } catch (err) {
    console.error('Mark messages as read error:', err);
    throw err;
  }
};

export const editMessage = async (messageId: string, content: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        content,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update message.');
    }

    return await res.json();
  } catch (err) {
    console.error('Edit message error:', err);
    throw err;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete message.');
    }

    return await res.json();
  } catch (err) {
    console.error('Delete message error:', err);
    throw err;
  }
};
