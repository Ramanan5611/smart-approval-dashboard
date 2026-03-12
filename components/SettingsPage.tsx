import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Mail, Shield, Bell, Moon, Sun, ChevronLeft, Lock, Smartphone, Globe, Eye, EyeOff } from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
}

const SettingsPage: React.FC<Props> = ({ user, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in relative">
      {/* Decorative morphing background element */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 morph blur-3xl -z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 morph blur-3xl -z-10" style={{ animationDelay: '-4s' }}></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-10 slide-in">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white/50 backdrop-blur-sm hover:bg-white rounded-2xl text-slate-600 transition-all hover:shadow-lg border border-white/50"
            title="Back to Dashboard"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Account Settings</h1>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl shadow-sm border border-white/50">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Sidebar */}
        <aside className="space-y-3 slide-in" style={{ animationDelay: '0.1s' }}>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <UserIcon size={20} />
            <span className="font-bold tracking-tight">Identity Info</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 glass text-slate-600 rounded-2xl transition-all hover:bg-white/80 hover:scale-[1.02] border border-white/50">
            <Bell size={20} className="text-slate-400" />
            <span className="font-semibold tracking-tight">Alert Preferences</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 glass text-slate-600 rounded-2xl transition-all hover:bg-white/80 hover:scale-[1.02] border border-white/50">
            <Shield size={20} className="text-slate-400" />
            <span className="font-semibold tracking-tight">Privacy & Security</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 glass text-slate-600 rounded-2xl transition-all hover:bg-white/80 hover:scale-[1.02] border border-white/50">
            <Globe size={20} className="text-slate-400" />
            <span className="font-semibold tracking-tight">Localization</span>
          </button>
        </aside>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-10 slide-in" style={{ animationDelay: '0.2s' }}>
          {/* Profile Section */}
          <section className="glass-card rounded-3xl p-8 hover-lift border-white/60">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                <UserIcon size={24} />
              </div>
              Identity Profile
            </h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Legal Name</label>
                  <p className="text-slate-900 font-bold text-xl bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-inner">{user.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Access Level</label>
                  <div className="flex">
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm border ${
                      user.role === UserRole.ADMIN ? 'bg-red-500 text-white border-red-400' :
                      user.role === UserRole.STUDENT ? 'bg-blue-600 text-white border-blue-500' :
                      'bg-amber-500 text-white border-amber-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Identifier</label>
                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/80 shadow-inner">
                  <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl shadow-sm">
                    <Mail size={20} />
                  </div>
                  <p className="text-slate-900 font-bold text-lg">{user.username}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Token</label>
                <div className="relative group">
                  <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/80 shadow-inner transition-all group-focus-within:border-blue-300">
                    <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={user.password || '••••••••'}
                      readOnly
                      className="bg-transparent border-none outline-none w-full text-slate-900 font-bold text-lg tracking-widest focus:ring-0"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 px-1">
                    <Shield size={12} className="text-amber-500" />
                    <p className="text-[10px] text-slate-500 font-medium italic">Credentials managed by Institute Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="glass-card rounded-3xl p-8 hover-lift border-white/60">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Sun size={24} />
              </div>
              Environment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass p-5 rounded-3xl group transition-all hover:bg-white/80 flex flex-col gap-4 border-white/50">
                <div className="flex items-center justify-between w-full">
                  <div className="p-3 bg-blue-100/50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                    <Bell size={24} />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-110">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationsEnabled}
                      onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <p className="font-black text-slate-800 tracking-tight">Push Alerts</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Real-time sync</p>
                </div>
              </div>

              <div className="glass p-5 rounded-3xl group transition-all hover:bg-white/80 flex flex-col gap-4 border-white/50">
                <div className="flex items-center justify-between w-full">
                  <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-sm ${darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100/50 text-indigo-600'}`}>
                    {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-110">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)}
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-700"></div>
                  </label>
                </div>
                <div>
                  <p className="font-black text-slate-800 tracking-tight">Focus Mode</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Interface adaptive</p>
                </div>
              </div>
            </div>
          </section>

          {/* Secure CTA */}
          <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 morph blur-[80px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 morph blur-[60px] -ml-24 -mb-24" style={{ animationDelay: '-2s' }}></div>
            
            <div className="relative z-10 flex flex-col items-center sm:flex-row gap-10">
              <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Smartphone size={48} className="text-blue-400" />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-6">
                <div>
                  <h2 className="text-3xl font-black mb-2 flex items-center justify-center sm:justify-start gap-3">
                    <Shield className="text-blue-400" size={28} />
                    Secure Guard
                  </h2>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Protect your account with high-entropy multi-factor authentication.
                  </p>
                </div>
                <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1 active:translate-y-0 active:shadow-none">
                    Activate 2FA
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      
      {/* Footer Support */}
      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>© 2026 SmartApproval Academic Workflow System</p>
        <p className="mt-1">For support, contact <span className="text-blue-500 font-medium">admin@bitsathy.ac.in</span></p>
      </footer>
    </div>
  );
};

export default SettingsPage;
