import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, LogOut, Bell, LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 w-full shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white scale-100 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/20">
            <Mail size={18} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">TellMe</h1>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="relative group cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0A0A0A]"></span>
              <Bell size={20} className="text-neutral-400 group-hover:text-white transition-colors" />
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {profile?.displayName?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-white hidden sm:inline">
                  {profile?.displayName?.split(' ')[0] || 'ইউজার'}
                </span>
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                title="লগআউট"
              >
                <LogOut size={20} />
              </button>
            </div>
          </>
        ) : (
          <Link 
            to="/auth" 
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <LogIn size={18} />
            <span>লগইন</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
