import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import History from './pages/History';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import { useAuthStore } from './store/authStore';

function ProtectedLayout() {
  return (
    <>
      <div className="flex-1 overflow-y-auto w-full relative bg-gray-50 pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  const { token, initializeAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    setLoading(false);
  }, [initializeAuth]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto w-full h-[100dvh] relative shadow-lg bg-white overflow-hidden flex flex-col">
        <Routes>
          <Route path="/auth" element={!token ? <Auth /> : <Navigate to="/" />} />
          
          <Route element={token ? <ProtectedLayout /> : <Navigate to="/auth" />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
