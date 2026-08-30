import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto my-16 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Denied</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          You do not have permission to view or manage this resource with your current role{' '}
          <strong className="text-slate-800 uppercase font-bold">({user?.role || 'Guest'})</strong>.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-center space-x-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
