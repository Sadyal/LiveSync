import { useState, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';
import { Share2, UserPlus, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShareDoc = () => {
  const { id: docId } = useParams();
  const { backendUrl } = useContext(AppContent);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter email address');

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/docs/${docId}/share`,
        { email },
        { withCredentials: true }
      );
      toast.success(data.message || 'Collaborator added!');
      setEmail('');
      setIsOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2rem] shadow-2xl p-8 z-[210] border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                       <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900">Share Workspace</h3>
                       <p className="text-xs text-slate-500">Add collaborators to this document</p>
                    </div>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={handleShare} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Collaborator Email</label>
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[10px] text-amber-700 leading-relaxed font-medium">
                  Note: The recipient must have a LiveSync account to collaborate on this document.
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Invite</>}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareDoc;
