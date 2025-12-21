import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import { motion } from "framer-motion";
import { FileText, Users, Shield, Zap } from "lucide-react";

const Header = () => {
  const { userData } = useContext(AppContent);
  const displayName = userData?.name || "Developer";

  return (
    <section className="relative w-full bg-white">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-24 flex flex-col items-center text-center">
        
        {/* Logo */}
        <motion.img
          src={assets.header_img}
          alt="App Logo"
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-md border border-gray-200 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Greeting */}
        <motion.h1
          className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {displayName}
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-gray-600 text-base sm:text-lg max-w-xl mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Your hub to create documents, collaborate with your team, and stay productive — 
          clean, simple, and secure.
        </motion.p>

        {/* Feature Highlights */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex flex-col items-center">
            <FileText className="w-7 h-7 text-indigo-600 mb-2" />
            <p className="text-sm text-gray-700">Docs</p>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-7 h-7 text-purple-600 mb-2" />
            <p className="text-sm text-gray-700">Collaboration</p>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-7 h-7 text-green-600 mb-2" />
            <p className="text-sm text-gray-700">Security</p>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="w-7 h-7 text-yellow-500 mb-2" />
            <p className="text-sm text-gray-700">Fast Tools</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Header;
