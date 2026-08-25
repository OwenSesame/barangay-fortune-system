import axios from 'axios';

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    // Attach token only for our backend
    if (config.url && config.url.includes('localhost:5000')) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect to login if token is invalid/expired
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default axios;
