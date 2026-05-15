import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

const EmailVerify = () => {
  axios.defaults.withCredentials = true;
  const { backendUrl, userData, getUserData, authChecked, isLoggedIn } = useContext(AppContent);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    const fetchDataIfMissing = async () => {
      if (!userData || !userData._id) await getUserData();
    };
    fetchDataIfMissing();
  }, []);

  useEffect(() => {
    if (authChecked) {
      if (!userData || !userData.email) {
        toast.error("Please login to verify");
        navigate('/login');
      }
    }
  }, [authChecked, userData]);

  useEffect(() => {
    if (isLoggedIn && userData && userData.isAccountVerified) {
      navigate('/');
    }
  }, [isLoggedIn, userData]);

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
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, 6);
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const resendOtp = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/auth/send-verify-otp`);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Resend failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const otp = inputRefs.current.map(input => input.value).join('').trim();
      if (otp.length !== 6) {
        setIsLoading(false);
        return toast.error("Enter 6-digit OTP");
      }

      const response = await axios.post(
        `${backendUrl}/api/auth/verify-account`,
        { userId: userData?._id, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Account Verified!");
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden font-["Outfit"]'>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Verify Identity</h1>
            <p className="text-slate-400 text-sm text-center mt-2">
              We've sent a 6-digit code to your inbox.
            </p>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-8">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {Array(6).fill(0).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength='1'
                  required
                  ref={el => inputRefs.current[index] = el}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className='w-12 h-14 md:w-14 md:h-16 bg-white/5 border border-white/10 text-white text-center text-2xl font-bold rounded-2xl focus:border-indigo-500/50 outline-none transition-all'
                  autoComplete="off"
                />
              ))}
            </div>

            <button disabled={isLoading} className='w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex justify-center'>
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Verification"}
            </button>
            
            <p className="text-center text-slate-500 text-xs">
              Didn't receive the code? <span onClick={resendOtp} className="text-indigo-400 cursor-pointer hover:underline">Resend OTP</span>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerify;
