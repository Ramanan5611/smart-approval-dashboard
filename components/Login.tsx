import React, { useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { Lock, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userIdForOtp, setUserIdForOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: request, 1: verify & change
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
      setLoading(true);
      if (isRegister) {
        const user = await apiService.register({ username, password, role, name });
        onLogin(user);
      } else {
        const result = await apiService.login(username, password);
        if ((result as any).requiresOtp) {
          setRequiresOtp(true);
          setUserIdForOtp((result as any).userId);
        } else {
          onLogin(result as any);
        }
      }
    } catch (err: any) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await apiService.verifyOtp(userIdForOtp, otpCode);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.forgotPassword(username);
      setResetStep(1);
      toast.success('Recovery token sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.resetPassword(resetToken, newPassword);
      setIsForgotPassword(false);
      setResetStep(0);
      toast.success('Password reset successful! Please login.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
            {isForgotPassword ? 'Password Recovery' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] p-4 rounded-2xl border border-red-200/50 text-center fade-in">
              {error}
            </div>
          )}

          {requiresOtp ? (
            <div className="space-y-6 fade-in">
              <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-800">
                  Verification code sent to your email.
                </p>
              </div>
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">6-Digit Security Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full px-5 py-6 text-center text-3xl tracking-[1em] font-black bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95 uppercase tracking-widest text-xs"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setRequiresOtp(false)}
                className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : isForgotPassword ? (
            <div className="space-y-6 fade-in">
              {resetStep === 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium italic">Enter your identifier to receive a recovery token.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username / Email</label>
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
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || !username}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Sending...' : 'Send Recovery Token'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recovery Token</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
                      placeholder="Paste token from email"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 text-slate-400 rounded-lg group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        className="w-full pl-14 pr-5 py-4 bg-white/50 backdrop-blur-sm border border-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold placeholder:text-slate-300 shadow-inner"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading || !resetToken || newPassword.length < 6}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-green-200 active:scale-95 uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Resetting...' : 'Change Password'}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setResetStep(0); }}
                className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mt-4 text-center"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                  {!isRegister && (
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
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
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest text-xs mt-4"
              >
                {loading ? 'Processing...' : (isRegister ? 'Generate Account' : 'Establish Link')}
              </button>
            </div>
          )}
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