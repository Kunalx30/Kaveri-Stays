import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const MainLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1A1E1C] overflow-x-hidden">
      <Navbar />
      {/*
        The Navbar is fixed (position: fixed), so it sits above content.
        On the homepage the hero is full-bleed and intentionally sits beneath the
        transparent Navbar — no top padding needed.
        On all other pages we add pt-16 so content doesn't hide behind the fixed bar.
      */}
      <main className={`flex-1 overflow-x-hidden ${isHomePage ? '' : 'pt-16'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
