import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Mail, Lock, Key, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = Request code, 2 = Reset password
  const [resetCode, setResetCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/forgotpassword', { email });
      setLoading(false);
      if (res.data.success) {
        setResetCode(res.data.resetCode); // Stash code returned by mock endpoint
        setSuccessMsg('Reset code generated successfully!');
        setStep(2);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to request reset code.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!userEnteredCode || !newPassword) {
      return setError('Please fill in all fields');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setError('');
    setLoading(true);

    try {
      const res = await axios.put(`/api/auth/resetpassword/${userEnteredCode}`, {
        password: newPassword,
      });
      setLoading(false);
      if (res.data.success) {
        setSuccessMsg('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to reset password. Check code.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-violet-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3 neon-glow">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Client<span className="text-indigo-500">Sync</span>
          </h1>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-3">Reset Password</h2>
          <p className="text-zinc-400 text-sm mb-6">
            {step === 1
              ? 'Enter your email address to receive a secure recovery code.'
              : 'Enter the recovery code and choose a new password.'}
          </p>

          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-200 text-sm rounded-lg p-3.5 mb-6">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm rounded-lg p-3.5 mb-6 flex items-start space-x-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{successMsg}</p>
                {step === 2 && resetCode && (
                  <p className="mt-1 text-xs text-emerald-300">
                    Demo Mode Code: <span className="font-mono font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded text-white">{resetCode}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors duration-150 shadow-lg shadow-indigo-600/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                <span>{loading ? 'Requesting Code...' : 'Get Recovery Code'}</span>
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  6-Digit Recovery Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Key className="h-5 w-5" />
                  </div>
                  <input
                    id="code"
                    type="text"
                    value={userEnteredCode}
                    onChange={(e) => setUserEnteredCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="block w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm font-mono tracking-widest text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors duration-150 shadow-lg shadow-indigo-600/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                <span>{loading ? 'Resetting...' : 'Change Password'}</span>
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          )}

          <div className="mt-6 flex justify-between items-center text-sm">
            <Link
              to="/login"
              className="text-zinc-400 hover:text-white flex items-center space-x-1 transition duration-150"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
