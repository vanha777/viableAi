'use client';
import { FcGoogle } from 'react-icons/fc';
import { BsApple } from 'react-icons/bs';
import { AppProvider, useAppContext } from "@/app/utils/AppContext";
import { Db, Server } from '@/app/utils/db'
import { useState } from 'react';

const SSOLogin = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [userType, setUserType] = useState('founder');
  const handleSSOLogin = async (provider: string) => {
    setIsSpinning(true);
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (userType === "founder") {
      window.location.href = `https://metaloot-cloud-d4ec.shuttle.app/v1/api/player/oauth/${provider}?redirect_uri=${redirectUri}/dashboard/oauth/callback/founder`;
    } else {
      window.location.href = `https://metaloot-cloud-d4ec.shuttle.app/v1/api/player/oauth/${provider}?redirect_uri=${redirectUri}/dashboard/oauth/callback/distributor`;
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="text-center space-y-8">
        {/* Logo Circle with Glow Effect */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-white border border-gray-200 rounded-full 
                        flex items-center justify-center relative z-10 shadow-lg">
            <img
              src="/apple.png"
              alt="MetaLoot Logo"
              className={`w-20 h-20 ${isSpinning ? 'animate-spin' : ''}`}
            />
          </div>
          {/* Glowing effect behind the circle */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 
                        blur-xl rounded-full transform scale-150 -z-0"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-gray-600 text-sm tracking-wider">Welcome to</h2>
          <h1 className="text-gray-800 text-5xl font-light tracking-wider">CoLaunch</h1>
          <p className="text-gray-500 text-xl">Share Ideas, Connect & Find Partners</p>
        </div>

        {/* Add toggle switch */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm ${userType === 'founder' ? 'text-gray-800' : 'text-gray-500'}`}>Founder</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={userType === 'distributor'}
            onChange={(e) => setUserType(e.target.checked ? 'distributor' : 'founder')}
          />
          <span className={`text-sm ${userType === 'distributor' ? 'text-gray-800' : 'text-gray-500'}`}>Business Partner</span>
        </div>

        <div className="space-y-4 w-80">
          <button
            onClick={() => handleSSOLogin('google')}
            className="w-full px-6 py-3 bg-white border border-gray-200 rounded-lg
                     text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:shadow-md
                     transition-all duration-300 flex items-center justify-center gap-3"
          >
            <FcGoogle className="text-xl" />
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleSSOLogin('apple')}
            className="w-full px-6 py-3 bg-white border border-gray-200 rounded-lg
                     text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:shadow-md
                     transition-all duration-300 flex items-center justify-center gap-3"
          >
            <BsApple className="text-xl" />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="text-sm text-gray-500 mt-8">
          By proceeding, you agree to our{' '}
          <span className="text-gray-700 hover:text-gray-900 cursor-pointer transition-colors">Terms</span>{' '}
          &{' '}
          <span className="text-gray-700 hover:text-gray-900 cursor-pointer transition-colors">Privacy</span>
        </div>
      </div>
    </div>
  );
};

export default SSOLogin;
