import { BASE_URL } from '.';
import { getAuthHeaders } from './auth';

export const getMyNotifications = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to fetch notifications.');
    }

    return await res.json();
  } catch (err) {
    console.error('Get notifications error:', err);
    throw err;
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to mark notifications as read.');
    }

    return await res.json();
  } catch (err) {
    console.error('Mark notification read error:', err);
    throw err;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to mark all as read.');
    }

    return await res.json();
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    throw err;
  }
};

export const deleteNotification = async (id: string) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to delete notification.');
    }

    return await res.json();
  } catch (err) {
    console.error('Delete notification error:', err);
    throw err;
  }
};

export const clearReadNotifications = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications/clear-read`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to clear read notifications.');
    }

    return await res.json();
  } catch (err) {
    console.error('Clear read notifications error:', err);
    throw err;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/notifications/clear-all`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to delete all notifications.');
    }

    return await res.json();
  } catch (err) {
    console.error('Delete all notifications error:', err);
    throw err;
  }
};
