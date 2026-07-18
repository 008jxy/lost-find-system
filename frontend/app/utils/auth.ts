import API_BASE_URL from './api';

export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('avatar');
};

export const validateToken = async (): Promise<{ valid: boolean; userId?: number }> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { valid: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.code === 200) {
      return { valid: true, userId: data.data?.id };
    } else {
      clearAuthStorage();
      return { valid: false };
    }
  } catch {
    return { valid: false };
  }
};