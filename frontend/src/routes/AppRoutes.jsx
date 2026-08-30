import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails';
import Availability from '../pages/Availability';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import CreateBooking from '../pages/CreateBooking';
import BookingDetails from '../pages/BookingDetails';
import MyBookings from '../pages/MyBookings';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * Central routing configuration for Kaveri Stays frontend.
 *
 * Phase F3: Public discovery routes
 * Phase F4: Booking creation, details, and my-bookings routes
 *
 * /                             → Home
 * /properties                  → Properties catalog (public)
 * /properties/:propertyId      → Property details (public)
 * /properties/:propertyId/availability → Availability search for property (public)
 * /availability                → Global availability search (public)
 * /login                       → Login (public)
 * /register                    → Register (public)
 * /bookings/create             → Create booking (protected)
 * /bookings/:bookingId         → Booking details (protected)
 * /my-bookings                 → My bookings list (protected)
 * /dashboard                   → Dashboard (protected)
 * /unauthorized                → Unauthorized page
 * *                            → 404 Not Found
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:propertyId" element={<PropertyDetails />} />
        <Route path="properties/:propertyId/availability" element={<Availability />} />
        <Route path="availability" element={<Availability />} />

        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* Protected Booking Routes */}
        <Route
          path="bookings/create"
          element={
            <ProtectedRoute>
              <CreateBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/:bookingId"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Wildcard */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
