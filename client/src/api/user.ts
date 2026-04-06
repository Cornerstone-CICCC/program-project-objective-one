import { AuthResultType, clearToken, getAuthHeaders, IUser } from './auth';
import { BASE_URL } from '.';

export interface UpdateProfileData {
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  currPassword?: string;
  newPassword?: string;
}

export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Get user by id error:', err);
    return null;
  }
};

export const updateProfile = async (
  updateInfo: UpdateProfileData,
): Promise<AuthResultType | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateInfo),
    });

    if (!res.ok) return null;

    const data: AuthResultType = await res.json();
    return data;
  } catch (err) {
    console.error('Update profile error:', err);
    return null;
  }
};

export const deleteAccount = async (): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/users/delete`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      await clearToken();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Delete account error:', err);
    return false;
  }
};

export const uploadAvatarImage = async (imageUri: string): Promise<string | null> => {
  try {
    const { 'content-type': ignoredContentType, ...headers } = await getAuthHeaders();

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const res = await fetch(`${BASE_URL}/users/upload-avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const eroorText = await res.text();
      console.error('Upload failed:', eroorText);
      return null;
    }

    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error('Avatar upload network error:', err);
    return null;
  }
};
