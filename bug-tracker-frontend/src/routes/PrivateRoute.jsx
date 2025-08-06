import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/auth';

const PrivateRoute = ({ children, role }) => {
  if (!isAuthenticated()) {

    return <Navigate to="/" replace />;
  }

  const userRole = getUserRole();

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(userRole)) {
     
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
