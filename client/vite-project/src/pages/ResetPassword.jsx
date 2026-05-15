import React, { useState, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const { backendUrl } = useContext(AppContent);
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef([]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').slice(0, 6);
    paste.split('').forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email });
      if (data.success) {
        toast.success("Reset code sent!");
        setIsEmailSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map(e => e.value);
    const finalOtp = otpArray.join('');
    if (finalOtp.length !== 6) return toast.error("Enter 6-digit code");
    setOtp(finalOtp);
    setIsOtpSubmitted(true);
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/reset-password`, { email, otp, newPassword });
      if (data.success) {
        toast.success("Password Updated!");
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden font-["Outfit"]'>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <AnimatePresence mode="wait">
            {!isEmailSent ? (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex flex-col items-center mb-8">
                  <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 mb-4">
                    <KeyRound className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                  <p className="text-slate-400 text-sm text-center mt-2">Enter your email to receive a recovery code.</p>
                </div>
                <form onSubmit={onSubmitEmail} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email Address</label>
                    <div className='flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 transition-all'>
                      <Mail className="w-5 h-5 text-slate-500" />
                      <input type="email" placeholder='name@company.com' className='bg-transparent outline-none w-full text-white text-sm' value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" />
                    </div>
                  </div>
                  <button disabled={isLoading} className='w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex justify-center'>
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Code"}
                  </button>
                </form>
              </motion.div>
            ) : !isOtpSubmitted ? (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex flex-col items-center mb-8">
                  <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 mb-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white text-center">Verify Reset Code</h1>
                  <p className="text-slate-400 text-sm text-center mt-2">Enter the 6-digit code sent to {email}</p>
                </div>
                <form onSubmit={onSubmitOtp} className="space-y-8">
                  <div className='flex justify-between gap-2' onPaste={handlePaste}>
                    {Array(6).fill(0).map((_, index) => (
                      <input
                        key={index} type="text" maxLength='1' required ref={el => inputRefs.current[index] = el}
                        onInput={(e) => handleInput(e, index)} onKeyDown={(e) => handleKeyDown(e, index)}
                        className='w-12 h-14 md:w-14 md:h-16 bg-white/5 border border-white/10 text-white text-center text-2xl font-bold rounded-2xl focus:border-indigo-500/50 outline-none'
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <button className='w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all'>Verify Code</button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex flex-col items-center mb-8">
                  <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 mb-4">
                    <Lock className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">New Password</h1>
                  <p className="text-slate-400 text-sm text-center mt-2">Set a strong password to secure your account.</p>
                </div>
                <form onSubmit={onSubmitNewPassword} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">New Password</label>
                    <div className='flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 transition-all'>
                      <Lock className="w-5 h-5 text-slate-500" />
                      <input type="password" placeholder='••••••••' className='bg-transparent outline-none w-full text-white text-sm' value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="off" />
                    </div>
                  </div>
                  <button disabled={isLoading} className='w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all flex justify-center'>
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
