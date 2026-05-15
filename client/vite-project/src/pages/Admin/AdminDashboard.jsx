import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AppContent } from "../../context/AppContext";
import { toast } from "react-toastify";
import UsersTable from "./UsersTable";
import DocsTable from "./DocsTable";
import SystemHealth from "./SystemHealth";
import { Users, FileText, Shield, Activity, ArrowLeft, RefreshCw, Trash2, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { backendUrl, user } = useContext(AppContent);
  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const usersRef = useRef(null);
  const docsRef = useRef(null);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">This terminal is for administrative eyes only.</p>
          <button onClick={() => navigate("/")} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Return Home</button>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [usersRes, docsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/users`, { withCredentials: true }),
        axios.get(`${backendUrl}/api/admin/docs`, { withCredentials: true })
      ]);
      setUsers(usersRes.data.users);
      setDocs(docsRes.data.docs);
    } catch (err) {
      toast.error("Failed to sync admin data");
    } finally {
      setLoadingUsers(false);
      setLoadingDocs(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === "user" ? "admin" : "user";
      const { data } = await axios.patch(
        `${backendUrl}/api/admin/users/${userId}`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success(`Role updated to ${newRole}`);
      setUsers(users.map(u => (u._id === userId ? data.user : u)));
    } catch (err) {
      toast.error("Role update failed");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/users/${userId}`, { withCredentials: true });
      toast.success("User purged");
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/docs/${docId}`, { withCredentials: true });
      toast.success("Document removed");
      setDocs(docs.filter(d => d._id !== docId));
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "blue", ref: usersRef },
    { label: "Admins", value: users.filter(u => u.role === "admin").length, icon: Shield, color: "indigo", ref: usersRef },
    { label: "Regular Users", value: users.filter(u => u.role === "user").length, icon: Activity, color: "emerald", ref: usersRef },
    { label: "Total Documents", value: docs.length, icon: FileText, color: "purple", ref: docsRef },
  ];

  const scrollToRef = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-slate-400"/></button>
              <div>
                 <h1 className="text-xl font-bold text-slate-900">Admin Control Center</h1>
                 <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">System Management v2.0</p>
              </div>
           </div>
           <button 
             onClick={fetchData} 
             disabled={isRefreshing}
             className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
           >
             <RefreshCw className={`w-5 h-5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Column: Health & Stats */}
           <div className="lg:col-span-8 space-y-8">
              <SystemHealth />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {stats.map((stat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      onClick={() => scrollToRef(stat.ref)}
                      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                    >
                       <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}>
                          <stat.icon className="w-5 h-5" />
                       </div>
                       <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{stat.label}</p>
                       <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                    </motion.div>
                 ))}
              </div>

              {/* Users Table */}
              <section ref={usersRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> User Directory</h3>
                    <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 uppercase">{users.length} Active</span>
                 </div>
                 <div className="p-2">
                    <UsersTable users={users} loadingUsers={loadingUsers} toggleRole={toggleRole} deleteUser={deleteUser} />
                 </div>
              </section>
           </div>

           {/* Right Column: Docs */}
           <div className="lg:col-span-4 space-y-8">
              <section ref={docsRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden h-full">
                 <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /> Global Documents</h3>
                 </div>
                 <div className="p-2">
                    <DocsTable docs={docs} loadingDocs={loadingDocs} deleteDoc={deleteDoc} />
                 </div>
              </section>
           </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
