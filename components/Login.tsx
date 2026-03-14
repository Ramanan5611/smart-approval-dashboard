import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { Lock, User as UserIcon } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    /* 
    if (!validateEmail(username)) {
      setError('Please enter a valid official email address.');
      return;
    }
    */

    try {
      if (isRegister) {
        const user = await apiService.register({ username, password, role, name });
        onLogin(user);
      } else {
        const user = await apiService.login(username, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Invalid credentials'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 gradient-mesh p-4 relative overflow-hidden">
      {/* Dynamic Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-[30rem] h-[30rem] bg-blue-400/10 morph blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-[30rem] h-[30rem] bg-indigo-400/10 morph blur-3xl" style={{ animationDelay: '-4s' }}></div>
      </div>

      <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] relative z-10 border border-white/60 fade-in">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center">
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
              <img 
                src="/logo.png" 
                alt="Smart Approval Logo" 
                className="w-20 h-20 relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-pointer" 
              />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
              Smart Approval
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600/60 mb-8 ml-1">
              {isRegister ? 'Identity Generation' : 'Secure Enterprise Portal'}
            </p>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] p-4 rounded-2xl border border-red-200/50 text-center fade-in">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Identity Name</label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
                placeholder="Ex. Raaghav"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          {isRegister && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Role</label>
              <select
                className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold shadow-inner"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="STUDENT">Student Learner</option>
                <option value="FACULTY">Faculty Adviser</option>
                <option value="HOD">Dept. HOD</option>
                <option value="STUDENT_AFFAIRS">Student Affairs</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 text-slate-400 rounded-lg group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <UserIcon size={16} />
              </div>
              <input
                type="text"
                className="w-full pl-14 pr-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
                placeholder="Ex. admin_system"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 text-slate-400 rounded-lg group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Lock size={16} />
              </div>
              <input
                type="password"
                className="w-full pl-14 pr-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest text-xs"
          >
            {isRegister ? 'Generate Account' : 'Establish Link'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setName('');
              setRole('STUDENT');
            }}
            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isRegister ? 'Returning User? Sign In' : 'New Identifier? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;