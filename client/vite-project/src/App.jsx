import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";
import Editor from "./pages/docs/Editor";
import VideoCall from "./pages/VideoCall";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContent } from "./context/AppContext";

const App = () => {
  const { isLoggedIn, authChecked, user } = useContext(AppContent);

  if (!authChecked) return <div>Loading...</div>; // ✅ Wait for auth check

  // ✅ Admin route protection
  const AdminRoute = ({ children }) => {
    if (!isLoggedIn) return <Navigate to="/login" />;
    if (!user) return <div>Loading user...</div>; // Wait for user object
    if (user.role !== "admin") return <Navigate to="/" />;
    return children;
  };

  return (
    <>
      <ToastContainer theme="colored" position="top-center" />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!isLoggedIn ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/docs/:id" element={<Editor />} />
        <Route path="/video-call" element={<VideoCall />} />

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
