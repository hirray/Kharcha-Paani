import React, { useState } from 'react';
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin 
        ? { phone: formData.phone, password: formData.password }
        : formData;
        
      const { data } = await axios.post(endpoint, payload);
      login(data.data.token, data.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 justify-center">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Kharcha</h1>
      
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button 
          className={`flex-1 py-2 rounded-md font-medium ${isLogin ? 'bg-white shadow' : 'text-gray-500'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button 
          className={`flex-1 py-2 rounded-md font-medium ${!isLogin ? 'bg-white shadow' : 'text-gray-500'}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        )}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Phone Number"
          className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded-lg font-semibold mt-4 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
}
