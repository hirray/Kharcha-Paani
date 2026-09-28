import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        <NavLink to="/" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <Home size={24} />
          <span className="text-xs font-medium">Home</span>
        </NavLink>
        <NavLink to="/history" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <Clock size={24} />
          <span className="text-xs font-medium">History</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          <User size={24} />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
