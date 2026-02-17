import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      // OAuth failed
      setError(decodeURIComponent(errorParam));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else if (token) {
      // OAuth succeeded - store token
      localStorage.setItem('sessionToken', token);
      
      // Redirect to home page
      navigate('/');
    } else {
      // No token or error - something went wrong
      setError('Authentication failed. Please try again.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {error ? (
            <>
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                เกิดข้อผิดพลาด
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...</p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                กำลังเข้าสู่ระบบ...
              </h2>
              <p className="text-gray-600">กรุณารอสักครู่</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
