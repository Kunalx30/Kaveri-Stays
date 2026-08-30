import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="max-w-lg mx-auto my-16 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-black text-brand-600 tracking-tight">404</span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Page Not Found</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The page or destination you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-center">
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white gradient-brand hover:opacity-95 shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
