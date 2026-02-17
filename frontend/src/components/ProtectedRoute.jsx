import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, verifyToken } from '../utils/auth';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Quick check for token existence
      if (!isAuthenticated()) {
        setIsVerifying(false);
        setIsValid(false);
        return;
      }

      // Verify token with backend
      const valid = await verifyToken();
      setIsValid(valid);
      setIsVerifying(false);
    };

    checkAuth();
  }, []);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return children;
}

export default ProtectedRoute;
