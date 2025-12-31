import React, { useState } from 'react';
import { Cpu, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const { data } = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            localStorage.setItem('opcua_token', data.access_token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blobs for aesthetic */}
            <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute bottom-0 -right-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

            <div className="w-full max-w-md space-y-8 relative">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-4 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-200 mb-4 animate-in zoom-in duration-500">
                        <Cpu size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-surface-900 tracking-tight">Welcome Back</h1>
                    <p className="text-surface-500">Secure access to your OPC UA Management Portal</p>
                </div>

                <form onSubmit={handleLogin} className="card shadow-2xl shadow-surface-200/50 p-10 border-none space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-surface-700 ml-1">Username</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-surface-50 border-2 border-surface-50 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-surface-700 ml-1">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-surface-50 border-2 border-surface-50 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded border-surface-200 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                            <span className="text-sm text-surface-500 group-hover:text-surface-700 transition-colors">Keep me signed in</span>
                        </label>
                        <button type="button" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">Forgot Password?</button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                Sign In to Dashboard
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-surface-400 text-sm">
                    &copy; 2024 Industrial Pi Solutions. All rights reserved.
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1) translate(30px, -50px); }
          66% { transform: scale(0.9) translate(-20px, 20px); }
          100% { transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}} />
        </div>
    );
};

export default Login;
