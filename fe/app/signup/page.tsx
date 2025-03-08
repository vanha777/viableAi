'use client';
import { FcGoogle } from 'react-icons/fc';
import { BsApple } from 'react-icons/bs';
import { AppProvider, useAppContext } from "@/app/utils/AppContext";
import { Db, Server } from '@/app/utils/db'
import { useState } from 'react';

const SSOLogin = () => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSSOLogin = async (provider: string) => {
    setIsSpinning(true);
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    window.location.href = `https://metaloot-cloud-d4ec.shuttle.app/v1/api/player/oauth/${provider}?redirect_uri=${redirectUri}/signup/oauth/callback`;

    //     setTokens('test-access-token', 'test-refresh-token');
    //     setUser({
    //       id: 'test-id',
    //       email: 'test@test.com',
    //       name: 'Test User',
    //       avatar: 'https://example.com/avatar.jpg'
    //     });
    //     setGame([
    //         {
    //             id: '0x1234567890123456789012345678901234567890',
    //       name: 'Test Game',
    //       genre: 'Action',
    //       publisher: 'Test Publisher',
    //       photo: 'https://tzqzzuafkobkhygtccse.supabase.co/storage/v1/object/public/biz_touch/crypto-ql/demo.jpg',
    //       releaseDate: '2024-03-15'
    //     },
    //     {
    //         id: '0x1234567890123456789012345678901234567891',
    //       name: 'Test Game 2',
    //       genre: 'Adventure',
    //       publisher: 'Test Publisher 2',
    //       photo: 'https://tzqzzuafkobkhygtccse.supabase.co/storage/v1/object/public/biz_touch/crypto-ql/cuttherope',
    //       releaseDate: '2024-04-20'
    //     },
    //     {
    //         id: '0x1234567890123456789012345678901234567892',
    //       name: 'Test Game 3',
    //       genre: 'RPG',
    //       publisher: 'Test Publisher 3',
    //       photo: 'https://tzqzzuafkobkhygtccse.supabase.co/storage/v1/object/public/biz_touch/crypto-ql/uncleahmed',
    //       releaseDate: '2024-05-10'
    //     }
    // ]);
    // try {
    //   await signIn(provider, { callbackUrl: '/dashboard' });
    // } catch (error) {
    //   console.error('SSO login error:', error);
    // }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black">
      <div className="text-center space-y-8">
        {/* Logo Circle with Glow Effect */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                        flex items-center justify-center relative z-10">
            <img 
              src="/transLogo.png" 
              alt="MetaLoot Logo" 
              className={`w-20 h-20 ${isSpinning ? 'animate-spin' : ''}`} 
            />
          </div>
          {/* Glowing effect behind the circle */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                        blur-xl rounded-full transform scale-150 -z-0"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-white/60 text-sm tracking-wider">Blockchain API for</h2>
          <h1 className="text-white text-5xl font-light tracking-wider">Gaming</h1>
          <p className="text-white/40 text-xl">Secure Authentication</p>
        </div>

        <div className="space-y-4 w-80">
          <button
            onClick={() => handleSSOLogin('google')}
            className="w-full px-6 py-3 bg-black/50 border border-white/10 rounded-lg
                     text-white/60 hover:text-white hover:border-white/30 
                     transition-all duration-300 flex items-center justify-center gap-3"
          >
            <FcGoogle className="text-xl" />
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleSSOLogin('apple')}
            className="w-full px-6 py-3 bg-black/50 border border-white/10 rounded-lg
                     text-white/60 hover:text-white hover:border-white/30 
                     transition-all duration-300 flex items-center justify-center gap-3"
          >
            <BsApple className="text-xl" />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="text-sm text-white/40 mt-8">
          By proceeding, you agree to our{' '}
          <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Terms</span>{' '}
          &{' '}
          <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Privacy</span>
        </div>
      </div>
    </div>
  );
};

export default SSOLogin;
