export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

export const clearToken = () => localStorage.removeItem('auth_token');
