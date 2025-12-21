// src/Admin/AdminDashboard.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AppContent } from "../../context/AppContext";
import { toast } from "react-toastify";
import UsersTable from "./UsersTable";
import DocsTable from "./DocsTable";

export default function AdminDashboard() {
  const { backendUrl, user } = useContext(AppContent);
  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const usersRef = useRef(null);
  const docsRef = useRef(null);

  // ✅ Admin access check
  if (user?.role !== "admin") {
    return <div className="p-6 text-red-600">Access denied. Admins only.</div>;
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/users`, { withCredentials: true });
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch documents
  const fetchDocs = async () => {
    try {
      setLoadingDocs(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/docs`, { withCredentials: true });
      setDocs(data.docs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDocs();
  }, []);

  // Toggle user role
  const toggleRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === "user" ? "admin" : "user";
      const { data } = await axios.patch(
        `${backendUrl}/api/admin/users/${userId}`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success(`User role updated to ${newRole}`);
      setUsers(users.map(u => (u._id === userId ? data.user : u)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/users/${userId}`, { withCredentials: true });
      toast.success("User deleted");
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  // Delete document
  const deleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/docs/${docId}`, { withCredentials: true });
      toast.success("Document deleted");
      setDocs(docs.filter(d => d._id !== docId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  // ✅ Analytics calculations
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === "admin").length;
  const totalRegularUsers = users.filter(u => u.role === "user").length;
  const totalDocs = docs.length;

  // Scroll to section
  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div
          onClick={() => scrollToRef(usersRef)}
          className="bg-blue-600 text-white p-4 rounded shadow cursor-pointer hover:scale-105 transition"
        >
          <p className="text-sm">Total Users</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-xs mt-1 underline">View Users</p>
        </div>
        <div
          onClick={() => scrollToRef(usersRef)}
          className="bg-green-600 text-white p-4 rounded shadow cursor-pointer hover:scale-105 transition"
        >
          <p className="text-sm">Admins</p>
          <p className="text-2xl font-bold">{totalAdmins}</p>
          <p className="text-xs mt-1 underline">View Users</p>
        </div>
        <div
          onClick={() => scrollToRef(usersRef)}
          className="bg-indigo-600 text-white p-4 rounded shadow cursor-pointer hover:scale-105 transition"
        >
          <p className="text-sm">Regular Users</p>
          <p className="text-2xl font-bold">{totalRegularUsers}</p>
          <p className="text-xs mt-1 underline">View Users</p>
        </div>
        <div
          onClick={() => scrollToRef(docsRef)}
          className="bg-purple-600 text-white p-4 rounded shadow cursor-pointer hover:scale-105 transition"
        >
          <p className="text-sm">Documents</p>
          <p className="text-2xl font-bold">{totalDocs}</p>
          <p className="text-xs mt-1 underline">View Documents</p>
        </div>
      </div>

      {/* Users Section */}
      <section ref={usersRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-3">Users</h3>
        <UsersTable
          users={users}
          loadingUsers={loadingUsers}
          toggleRole={toggleRole}
          deleteUser={deleteUser}
        />
      </section>

      {/* Documents Section */}
      <section ref={docsRef}>
        <h3 className="text-xl font-semibold mb-3">Documents</h3>
        <DocsTable
          docs={docs}
          loadingDocs={loadingDocs}
          deleteDoc={deleteDoc}
        />
      </section>
    </div>
  );
}
