'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-rose-900">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <p className="text-lg mb-4">已登入為 <strong>{user.username}</strong></p>
          <Link href="/" className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600">
            返回主頁
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, email);
      }
      // Redirect happens automatically via auth state
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-rose-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">🀄 麻將計數機</h1>
          <p className="text-white/80 text-sm mt-1">
            {isLogin ? '登入您的帳戶' : '創建新帳戶'}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用戶名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="輸入用戶名"
              required
              minLength={3}
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電郵 (可選)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="輸入密碼"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '處理中...' : (isLogin ? '登入' : '註冊')}
          </button>
        </form>
        
        {/* Toggle */}
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? '還未註冊?' : '已有帳戶?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-2 text-red-600 font-medium hover:underline"
            >
              {isLogin ? '立即註冊' : '立即登入'}
            </button>
          </p>
        </div>
        
        {/* Back to home */}
        <div className="p-4 border-t text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回主頁
          </Link>
        </div>
      </div>
    </div>
  );
}
