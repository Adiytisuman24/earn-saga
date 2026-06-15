import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { Sparkles, ShieldCheck, Zap, Award, Check } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const res = await api.post('/auth/google', {
          token: tokenResponse.access_token,
        });
        login(res.data.user);
        navigate('/offers');
      } catch (err) {
        console.error('Login failed', err);
        setError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google Login failed.');
    }
  });

  const handleLoginClick = () => {
    if (!agreed) {
      setError('Please agree to the Terms & Conditions first.');
      return;
    }
    setError('');
    googleLogin();
  };

  return (
    <div className="min-h-screen bg-[#0A0514] flex items-center justify-center p-4 sm:p-8 font-sans text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">
        
        {/* Left Side - Hero Content */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <Zap className="w-8 h-8 text-emerald-400 fill-emerald-400" />
            </div>
            <span className="text-3xl font-black italic tracking-wider text-white">
              EARN<span className="text-emerald-400">SAGA</span>
            </span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-black leading-none tracking-tighter mb-6 italic">
            <span className="text-white block">EARN.</span>
            <span className="text-emerald-400 block">PLAY.</span>
            <span className="text-[#a052ff] block">WIN.</span>
            <span className="text-white block">REPEAT!</span>
          </h1>

          <p className="text-xl text-slate-400 font-medium mb-10 max-w-md">
            Complete tasks, play games, and <span className="text-emerald-400 font-bold">earn real rewards!</span>
          </p>

          <div className="flex gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex-1">
              <div className="text-emerald-400 font-black text-2xl mb-1">+150</div>
              <div className="text-slate-300 font-semibold">Complete Task</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex-1">
              <div className="text-[#a052ff] font-black text-2xl mb-1">+500</div>
              <div className="text-slate-300 font-semibold">Daily Bonus</div>
            </div>
          </div>

          <div className="flex gap-10 text-sm font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div> 500K+ Users
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div> 10M+ Tasks
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div> 4.8 Rating
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex items-center justify-center">
          <div className="bg-[#120B22]/80 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2rem] w-full max-w-[480px] shadow-2xl relative">
            <div className="absolute top-[-20px] right-8 bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#0A0514] px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30">
              <Zap size={16} className="fill-[#0A0514]" /> Rewards await!
            </div>

            <div className="text-center mb-10 mt-4">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to</h2>
              <div className="text-4xl font-black italic tracking-wide mb-4">
                EARN <span className="text-emerald-400">SAGA</span><Sparkles className="inline w-6 h-6 text-emerald-400 ml-1 pb-2" />
              </div>
              <p className="text-slate-400 font-medium">Sign in to start your <span className="text-emerald-400 font-bold">earning</span> journey 🚀</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleLoginClick}
              disabled={isLoading}
              className="w-full bg-white text-slate-900 font-bold text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors mb-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="flex items-start gap-3 mb-10">
              <button 
                onClick={() => setAgreed(!agreed)}
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${agreed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 bg-transparent'}`}
              >
                {agreed && <Check size={14} className="text-[#0A0514]" />}
              </button>
              <p className="text-sm text-slate-400 font-medium">
                I agree to the <a href="#" className="text-[#a052ff] hover:text-purple-400 transition-colors">Terms & Conditions</a> and <a href="#" className="text-[#a052ff] hover:text-purple-400 transition-colors">Privacy Policy</a>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                <span className="text-xs font-bold text-white">Secure</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="w-6 h-6 text-white mb-2" />
                <span className="text-xs font-bold text-white">Fast Payouts</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Award className="w-6 h-6 text-[#a052ff] mb-2" />
                <span className="text-xs font-bold text-white">100% Free</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
