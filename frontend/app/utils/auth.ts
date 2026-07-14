export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('avatar');
};

export const validateToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    const response = await fetch('http://localhost:5000/api/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.code === 200) {
      return true;
    } else {
      clearAuthStorage();
      return false;
    }
  } catch {
    return false;
  }
};