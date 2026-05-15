import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import {
  createNewDoc,
  getAllDocs,
  renameDoc,
  deleteDoc,
  getDocById,
} from "../utils/api";
import { 
  FileText, 
  Plus, 
  Video, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  LayoutGrid,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const Home = () => {
  const { isLoggedIn, authChecked, user } = useContext(AppContent);
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDocId, setEditDocId] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const navigate = useNavigate();

  const latestTitle = useRef("");
  const latestDocId = useRef("");

  useEffect(() => {
    if (authChecked && isLoggedIn) {
      loadDocuments();
    }
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    const filtered = documents.filter(doc => 
      (doc.title || "Untitled Document").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    try {
      const docs = await getAllDocs();
      setDocuments(docs);
      setFilteredDocs(docs);
    } catch (err) {
      toast.error("Failed to load workspace");
    }
  };

  const handleCreateDoc = async () => {
    try {
      const docId = await createNewDoc();
      navigate(`/docs/${docId}`);
    } catch (error) {
      toast.error("Cloud synchronization failed. Try again.");
    }
  };

  const handleTitleSubmit = async () => {
    const finalTitle = latestTitle.current.trim();
    const docId = latestDocId.current;

    if (!finalTitle || finalTitle === documents.find(d => d._id === docId)?.title) {
      setEditDocId(null);
      return;
    }

    try {
      await renameDoc(docId, finalTitle);
      setDocuments(prev => prev.map(d => d._id === docId ? { ...d, title: finalTitle } : d));
      toast.success("Document renamed");
    } catch (error) {
      toast.error("Rename failed");
    }
    setEditDocId(null);
  };

  const handleDeleteDoc = async (id) => {
    try {
      await deleteDoc(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
      toast.success("Deleted from cloud");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleDownloadDoc = async (id, title) => {
    try {
      const doc = await getDocById(id);
      let textContent = doc.content?.ops ? doc.content.ops.map(op => op.insert).join("") : JSON.stringify(doc.content);
      const blob = new Blob([textContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title || "Untitled"}.txt`;
      link.click();
      toast.success("Downloaded");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar />
      
      {/* Dynamic Hero Section */}
      <div className="pt-24 pb-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-2"
              >
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <p className="text-slate-500">Your professional workspace is ready.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search workspace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <button 
                onClick={handleCreateDoc}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-slate-800">Recent Documents</h2>
             <span className="bg-slate-200 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{filteredDocs.length}</span>
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
             <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
             <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Documents Grid/List */}
        <AnimatePresence mode="popLayout">
          {filteredDocs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No documents found</h3>
              <p className="text-slate-500 mb-6">Create a new one to get started.</p>
              <button onClick={handleCreateDoc} className="text-indigo-600 font-bold hover:underline">Start Creating</button>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocs.map((doc) => (
                <motion.div
                  key={doc._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownloadDoc(doc._id, doc.title)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Download className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>

                  {editDocId === doc._id ? (
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        value={titleInput}
                        onChange={(e) => { setTitleInput(e.target.value); latestTitle.current = e.target.value; }}
                        autoFocus
                        className="flex-1 bg-slate-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                      />
                      <button onClick={handleTitleSubmit} className="p-1.5 bg-indigo-600 text-white rounded-lg"><Check className="w-4 h-4"/></button>
                      <button onClick={() => setEditDocId(null)} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <h4 
                        onClick={() => { setEditDocId(doc._id); setTitleInput(doc.title || "Untitled"); latestDocId.current = doc._id; latestTitle.current = doc.title || "Untitled"; }}
                        className="font-bold text-slate-900 truncate mb-1 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {doc.title || "Untitled Document"}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(doc.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => navigate(`/docs/${doc._id}`)}
                    className="w-full py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-sm font-bold transition-all mt-2"
                  >
                    Open Document
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
               {filteredDocs.map((doc) => (
                 <div key={doc._id} className="flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                       <div>
                          <p className="font-bold text-slate-900 text-sm">{doc.title || "Untitled Document"}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Modified {new Date(doc.updatedAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => navigate(`/docs/${doc._id}`)} className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg">View</button>
                       <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Modern Action Menu */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 flex flex-col items-end gap-4 z-[100]">
        <AnimatePresence>
          {fabOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              <motion.button
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onClick={handleCreateDoc}
                className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all text-sm font-bold text-slate-700"
              >
                <FileText className="w-4 h-4 text-indigo-500" /> New Document
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onClick={() => navigate("/video-call")}
                className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all text-sm font-bold text-slate-700"
              >
                <Video className="w-4 h-4 text-purple-500" /> Start Meeting
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setFabOpen(!fabOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-5 rounded-full shadow-2xl transition-all duration-300 ${fabOpen ? 'bg-slate-800 text-white rotate-45' : 'bg-indigo-600 text-white shadow-indigo-500/40'}`}
        >
          <Plus size={28} />
        </motion.button>
      </div>
    </div>
  );
};

export default Home;
