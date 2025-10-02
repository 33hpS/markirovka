import * as React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// TODO: Replace with real auth state
const isAuthed = true;

const ProtectedRoute: React.FC = () => {
  const loc = useLocation();
  if (!isAuthed) {
    return <Navigate to='/login' state={{ from: loc.pathname }} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
