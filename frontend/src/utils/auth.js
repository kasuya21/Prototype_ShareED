import axios from 'axios';

/**
 * Get the stored session token
 */
export const getToken = () => {
  return localStorage.getItem('sessionToken');
};

/**
 * Store session token
 */
export const setToken = (token) => {
  localStorage.setItem('sessionToken', token);
};

/**
 * Remove session token
 */
export const removeToken = () => {
  localStorage.removeItem('sessionToken');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Verify token with backend
 */
export const verifyToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    const response = await axios.post('/api/auth/verify', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data.valid;
  } catch (error) {
    console.error('Token verification failed:', error);
    removeToken();
    return false;
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await axios.get('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await axios.post('/api/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
  }
};

/**
 * Setup axios interceptor to add auth token to all requests
 */
export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Unauthorized - remove token and redirect to login
        removeToken();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};
