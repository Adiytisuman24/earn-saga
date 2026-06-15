import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Wallet, Zap } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="bg-[#0A0514]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/offers" className="flex items-center gap-2 group">
            <div className="bg-emerald-500/20 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
            <span className="text-xl font-black italic tracking-wider text-white">
              EARN<span className="text-emerald-400">SAGA</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              to="/offers"
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                location.pathname === '/offers' || location.pathname.startsWith('/offers/')
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Offers
            </Link>
            <Link
              to="/wallet"
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                location.pathname === '/wallet'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Wallet
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-emerald-500/40" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-slate-300 font-medium text-sm flex flex-col sm:flex-row items-start sm:items-center gap-1">
                <span>Welcome, <span className="text-white font-bold">{user.name?.split(' ')[0]}</span></span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" title="Your PubScale Test User ID">
                  ID: {user.id}
                </span>
              </span>
            </div>

            <Link
              to="/wallet"
              className="sm:hidden flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/10 px-3 py-2 rounded-xl transition-all font-bold text-sm"
            >
              <Wallet size={16} />
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-all font-bold text-sm border border-rose-500/20 hover:border-rose-500/40"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
