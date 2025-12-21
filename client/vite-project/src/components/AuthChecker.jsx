import { useContext, useEffect } from "react";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthChecker = ({ children }) => {
  const { setIsLoggedIn, setUserData } = useContext(AppContent);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const validateUser = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/data`, {
          withCredentials: true
        });

        if (data.success) {
          setIsLoggedIn(true);
          setUserData(data.user);
          console.log("✅ User authenticated");
        } else {
          throw new Error();
        }
      } catch (err) {
        console.warn("🚫 User not authenticated. Redirecting...");
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/login");
      }
    };

    validateUser();
  }, []);

  return children;
};

export default AuthChecker;
