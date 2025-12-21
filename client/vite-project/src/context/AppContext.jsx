import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // ✅ full user object
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutFlag, setLogoutFlag] = useState(false);

  // ✅ fetch user data
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        withCredentials: true,
      });

      if (data.success) {
        setUser(data.user); // store in context
        localStorage.setItem('user', JSON.stringify(data.user)); // optional: persist
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

      // ✅ Allow admin route without redirect
      if (skipPaths.includes(path) || (path === '/admin' && user?.role === 'admin')) {
        setAuthChecked(true);
        return;
      }

      if (logoutFlag) {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('token');
        setLogoutFlag(false); // reset flag
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
          await getUserData(); // fetch user with role

          if (data.token) {
            localStorage.setItem('token', data.token); // save token for socket
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

        const status = error.response?.status;
        if (status !== 401 && status !== 404) {
          console.error('Auth check failed', error);
          toast.error(error.response?.data?.message || 'Error during auth check');
        }
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [logoutFlag, user]); // ✅ added user as dependency

  const value = {
    backendUrl,
    isLoggedIn,
    setIsLoggedIn,
    user,
    userData: user, // alias for clarity
    setUser,
    getUserData,
    authChecked,
    setLogoutFlag,
  };

  return <AppContent.Provider value={value}>{props.children}</AppContent.Provider>;
};
