import React, { useContext, useState, useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, backendUrl, setUser, setIsLoggedIn, setLogoutFlag } =
    useContext(AppContent);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-verify-otp`
      );
      if (data.success) {
        setDropdownOpen(false);
        setMenuOpen(false);
        navigate("/email-verify");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Verification request failed");
    }
  };

  const logout = async () => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        setUser(null);
        setIsLoggedIn(false);
        setLogoutFlag(true);
        setDropdownOpen(false);
        setMenuOpen(false);
        navigate("/login");
      } else {
        console.error("Logout failed:", res.data.message);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const scheduleCloseDropdown = (delay = 200) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
      closeTimeoutRef.current = null;
    }, delay);
  };

  return (
    <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer hover:opacity-80 transition"
          >
            <img src={assets.logo} alt="Logo" className="w-28 sm:w-32" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <div
                className="relative"
                onMouseEnter={openDropdown}
                onMouseLeave={() => scheduleCloseDropdown(200)}
              >
                {/* Avatar */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold cursor-pointer shadow-md select-none ring-2 ring-transparent hover:ring-indigo-300 transition"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  {user.name ? user.name[0].toUpperCase() : "?"}
                </motion.div>

                {/* Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
                      onMouseEnter={openDropdown}
                      onMouseLeave={() => scheduleCloseDropdown(150)}
                      role="menu"
                      aria-label="Account menu"
                    >
                      {!user.isVerified && (
                        <li
                          onClick={sendVerificationOtp}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                          role="menuitem"
                        >
                          Verify Email
                        </li>
                      )}
                      {user.role === "admin" && (
                        <li
                          onClick={() => {
                            navigate("/admin");
                            setDropdownOpen(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                          role="menuitem"
                        >
                          Admin Dashboard
                        </li>
                      )}
                      <li
                        onClick={logout}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        role="menuitem"
                      >
                        Logout
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 rounded-full px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg hover:opacity-90 transition"
              >
                Login
                <img src={assets.arrow_icon} alt="Arrow" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-700 focus:outline-none"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <span className="material-icons">close</span>
              ) : (
                <span className="material-icons">menu</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-200"
          >
            <div className="px-4 py-3 space-y-2">
              {user ? (
                <>
                  {!user.isVerified && (
                    <div
                      onClick={() => {
                        sendVerificationOtp();
                        setMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer rounded"
                    >
                      Verify Email
                    </div>
                  )}
                  {user.role === "admin" && (
                    <div
                      onClick={() => {
                        navigate("/admin");
                        setMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer rounded"
                    >
                      Admin Dashboard
                    </div>
                  )}
                  <div
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded"
                  >
                    Logout
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-md px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition"
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
