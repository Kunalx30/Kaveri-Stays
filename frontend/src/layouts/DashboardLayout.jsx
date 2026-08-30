import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>Signed in as: <strong className="text-slate-800">{user?.email}</strong></span>
          <span className="capitalize font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            {user?.role} Portal
          </span>
        </div>
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
