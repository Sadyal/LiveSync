import React, { useContext, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedIn, getUserData, isLoggedIn, authChecked } = useContext(AppContent);

  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authChecked && isLoggedIn) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      navigate(storedUser?.role === 'admin' ? '/admin' : '/');
    }
  }, [authChecked, isLoggedIn]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    axios.defaults.withCredentials = true;

    try {
      let data;
      const endpoint = state === 'Sign Up' ? '/api/auth/register' : '/api/auth/login';
      const payload = state === 'Sign Up' ? { name, email, password } : { email, password };
      
      const response = await axios.post(`${backendUrl}${endpoint}`, payload);
      data = response.data;

      if (data.success) {
        if (data.token) localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        await getUserData();
        const storedUser = JSON.parse(localStorage.getItem('user'));
        navigate(storedUser?.role === 'admin' ? '/admin' : '/');
        toast.success(data.message || 'Welcome to LiveSync');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden font-["Outfit"]'>
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='w-full max-w-md relative z-10'
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
           <motion.div 
             whileHover={{ scale: 1.1 }}
             onClick={() => navigate('/')}
             className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/20 cursor-pointer mb-4"
           >
              <div className="w-10 h-10 border-4 border-white rounded-xl flex items-center justify-center font-bold text-white text-xl">V</div>
           </motion.div>
           <h1 className="text-3xl font-bold text-white tracking-tight">LiveSync</h1>
           <p className="text-slate-400 text-sm mt-2">Next-generation real-time collaboration</p>
        </div>

        {/* Auth Card */}
        <div className='bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl'>
          <div className="flex gap-4 mb-8 p-1.5 bg-white/5 rounded-2xl">
             <button 
               onClick={() => setState('Login')}
               className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${state === 'Login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               Login
             </button>
             <button 
               onClick={() => setState('Sign Up')}
               className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${state === 'Sign Up' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               Register
             </button>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-4">
            <AnimatePresence mode="wait">
              {state === 'Sign Up' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Full Name</label>
                  <div className='flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 transition-all'>
                    <User className="w-5 h-5 text-slate-500" />
                    <input
                      onChange={(e) => setName(e.target.value)}
                      value={name}
                      className='bg-transparent outline-none w-full text-white text-sm placeholder:text-slate-600'
                      type="text"
                      placeholder="John Doe"
                      required
                      autoComplete="off"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email Address</label>
              <div className='flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 transition-all'>
                <Mail className="w-5 h-5 text-slate-500" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  className='bg-transparent outline-none w-full text-white text-sm placeholder:text-slate-600'
                  type="email"
                  placeholder="name@company.com"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Password</label>
              <div className='flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 transition-all'>
                <Lock className="w-5 h-5 text-slate-500" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className='bg-transparent outline-none w-full text-white text-sm placeholder:text-slate-600'
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {state === 'Login' && (
              <div className="text-right">
                <span 
                  onClick={() => navigate('/reset-password')} 
                  className='text-xs font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors'
                >
                  Forgot Password?
                </span>
              </div>
            )}

            <button 
              disabled={isLoading}
              className='w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50'
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {state}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
           By continuing, you agree to LiveSync's <span className="text-slate-400 underline cursor-pointer">Terms of Service</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
