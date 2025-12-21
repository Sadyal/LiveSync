import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';

const EmailVerify = () => {
  axios.defaults.withCredentials = true;
  
  // ✅ Added isLoggedIn here
  const { backendUrl, userData, getUserData, authChecked, isLoggedIn } = useContext(AppContent);
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [userId, setUserId] = useState('');

  // Fetch userData if missing
  useEffect(() => {
    const fetchDataIfMissing = async () => {
      if (!userData || !userData._id) {
        await getUserData();
      }
    };
    fetchDataIfMissing();
  }, []);

  // Handle redirection if not logged in
  useEffect(() => {
    if (authChecked) {
      if (!userData || !userData.email) {
        toast.error("Please login to verify your email");
        navigate('/login');
      } else {
        setUserId(userData._id);
      }
    }
  }, [authChecked, userData]);

  // Debug log
  useEffect(() => {
    console.log("Current userData in EmailVerify:", userData);
  }, [userData]);

  // Input handlers
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
    const pasteArray = paste.split('');
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  // Submit handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      let id = userData?._id;
      if (!id) {
        await getUserData(); // re-fetch if missing
      }

      id = userData?._id;
      if (!id) {
        toast.error("User ID not found. Cannot proceed with OTP verification.");
        return;
      }

      const otp = inputRefs.current.map(input => input.value).join('').trim();

      if (otp.length !== 6 || isNaN(otp)) {
        toast.error("Please enter a valid 6-digit OTP");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/auth/verify-account`,
        { userId: id, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  // ✅ Prevent visiting this page after verification
  useEffect(() => {
    if (isLoggedIn && userData && userData.isAccountVerified) {
      navigate('/');
    }
  }, [isLoggedIn, userData]);

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
      <img
        onClick={() => navigate('/')}
        src={assets.logo}
        alt="Logo"
        className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
      />

      <form onSubmit={onSubmitHandler} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>
          Email Verify OTP
        </h1>
        <p className='text-center mb-6 text-indigo-300'>
          Enter the 6-digit code sent to your email id.
        </p>

        <div className='flex justify-between mb-8' onPaste={handlePaste}>
          {Array(6).fill(0).map((_, index) => (
            <input
              type="text"
              maxLength='1'
              key={index}
              required
              className='w-12 h-12 bg-[#333a5c] text-white text-center text-xl rounded-md'
              ref={el => inputRefs.current[index] = el}
              onInput={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>
          Verify Email
        </button>
      </form>
    </div>
  );
};

export default EmailVerify;
