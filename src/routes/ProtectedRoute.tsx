import * as React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// TODO: Replace with real auth state
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const loc = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600' />
          <p className='mt-4 text-sm text-gray-600'>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: loc.pathname }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
