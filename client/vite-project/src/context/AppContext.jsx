import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutFlag, setLogoutFlag] = useState(false);

  // ✅ fetch user data (NO CHANGE)
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        withCredentials: true,
      });

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setUser(null);
        toast.error(data.message || 'Failed to fetch user data');
      }
    } catch (error) {
      setUser(null);
      toast.error(error.response?.data?.message || 'Failed to fetch user');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const path = window.location.pathname;
      const skipPaths = ['/login', '/register', '/forgot-password'];

      if (skipPaths.includes(path) || (path === '/admin' && user?.role === 'admin')) {
        setAuthChecked(true);
        return;
      }

      if (logoutFlag) {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('token');
        setLogoutFlag(false);
        setAuthChecked(true);
        return;
      }

      try {
        const { data } = await axios.post(
          `${backendUrl}/api/auth/is-auth`,
          {},
          { withCredentials: true }
        );

        if (data.success && data.isAuthenticated) {
          setIsLoggedIn(true);
          await getUserData();

          if (data.token) {
            localStorage.setItem('token', data.token);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('token');

        // 🔇 minimized noise (only log)
        console.log('Auth check failed');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [logoutFlag]);

  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    user,
    userData: user,
    setUser,
    getUserData,
    authChecked,
    setLogoutFlag,
  };

  return <AppContent.Provider value={value}>{props.children}</AppContent.Provider>;
};