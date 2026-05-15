import React, { useContext, useState, useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, Shield, LogOut, Mail, Home, Video } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, backendUrl, setUser, setIsLoggedIn, setLogoutFlag } = useContext(AppContent);

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
      const { data } = await axios.post(`${backendUrl}/api/auth/send-verify-otp`);
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
      const res = await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true });
      if (res.data.success) {
        setUser(null);
        setIsLoggedIn(false);
        setLogoutFlag(true);
        setDropdownOpen(false);
        setMenuOpen(false);
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Video Call", path: "/video-call", icon: Video },
  ];

  return (
    <nav className="w-full fixed top-0 left-0 z-[100] glass-light border-b border-white/20 shadow-sm transition-standard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
               <div className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center font-bold text-white text-xs">V</div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-transparent">LiveSync</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.path 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </button>
            ))}
            
            <div className="w-px h-6 bg-slate-200 mx-4" />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden lg:block">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-[110]"
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-2">
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      {!user.isVerified && (
                        <button
                          onClick={sendVerificationOtp}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Mail className="w-4 h-4" /> Verify Email
                        </button>
                      )}

                      {user.role === "admin" && (
                        <button
                          onClick={() => { navigate("/admin"); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Shield className="w-4 h-4" /> Admin Dashboard
                        </button>
                      )}

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-200"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => { navigate(link.path); setMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </button>
              ))}

              <div className="h-px bg-slate-100 mx-4 my-2" />

              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-3">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  {!user.isVerified && (
                    <button
                      onClick={sendVerificationOtp}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-indigo-600 bg-indigo-50 font-medium"
                    >
                      <Mail className="w-5 h-5" /> Verify Email
                    </button>
                  )}
                  {user.role === "admin" && (
                    <button
                      onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50"
                    >
                      <Shield className="w-5 h-5" /> Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100"
                >
                  Sign In
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
