import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import { motion } from "framer-motion";
import { FileText, Users, Shield, Zap, Sparkles, ArrowRight } from "lucide-react";

const Header = () => {
  const { userData, isLoggedIn } = useContext(AppContent);
  const navigate = useNavigate();
  const displayName = userData?.name || "Developer";

  return (
    <section className="relative w-full bg-white pt-20 md:pt-32 pb-16 overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-60" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center relative z-10">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-8"
        >
          <Sparkles className="w-3 h-3" />
          LiveSync 2.0 Is Here
        </motion.div>

        {/* Greeting */}
        <motion.h1
          className="text-4xl sm:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Collaborate at the <br className="hidden md:block"/>
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
            Speed of Thought
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-slate-500 text-base sm:text-xl max-w-2xl mb-12 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Experience the most professional real-time workspace. Create, share, and video call with your team in a seamless, secure cloud environment.
        </motion.p>

        {/* Action Buttons for Non-logged in users or just general highlight */}
        {!isLoggedIn && (
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate('/login')}
             className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-200 flex items-center gap-3 group transition-all mb-16"
           >
             Start Your Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </motion.button>
        )}

        {/* Feature Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {[
            { icon: FileText, label: "Smart Editor", color: "indigo", desc: "Live real-time sync" },
            { icon: Users, label: "Multiplayer", color: "purple", desc: "Infinite collaborators" },
            { icon: Shield, label: "Vault Security", color: "emerald", desc: "End-to-end encrypted" },
            { icon: Zap, label: "Instant Sync", color: "amber", desc: "Low-latency cloud" }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className={`p-4 rounded-2xl bg-${feature.color}-50 text-${feature.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">{feature.label}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default Header;
