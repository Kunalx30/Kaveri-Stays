import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Kaveri Stays. All rights reserved.</p>
        <p className="text-slate-400">FastAPI Backend + React Vite Frontend (Phase F1)</p>
      </div>
    </footer>
  );
};

export default Footer;
