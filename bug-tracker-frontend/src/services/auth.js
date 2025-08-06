import { jwtDecode } from 'jwt-decode';
import axios from './api';

export const login = async (username, password) => {
  const res = await axios.post('/auth/login', { username, password });
  const { token, role, username: name } = res.data;
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('username', name);

  return { token, role };
};

export const logout = () => {
  localStorage.removeItem('token');
};


export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
};
export const getUsername = () => {
  const user = getCurrentUser();
  return user?.sub || user?.username || 'User';
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role?.toUpperCase() || null;
};



export const isAuthenticated = () => {
  const token = localStorage.getItem('token'); 
  return !!token; 
};
