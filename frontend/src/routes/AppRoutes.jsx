import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

/**
 * Central routing configuration for Kaveri Stays frontend.
 * Phase F1: Public Home page (/) and Fallback NotFound (*).
 * Additional routes and auth guards will be connected cleanly in Phase F2.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Main Layout containing Header & Footer */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Wildcard 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
