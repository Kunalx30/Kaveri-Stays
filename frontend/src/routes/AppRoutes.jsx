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
import CreatePayment from '../pages/CreatePayment';
import PaymentDetails from '../pages/PaymentDetails';
import MyPayments from '../pages/MyPayments';
import CreateReview from '../pages/CreateReview';
import EditReview from '../pages/EditReview';
import MyReviews from '../pages/MyReviews';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * Central routing configuration for Kaveri Stays frontend.
 *
 * Phase F3: Public discovery routes
 * Phase F4: Booking creation, details, and my-bookings routes
 * Phase F5: Payments, payment details, and payment history routes
 * Phase F6: Reviews, ratings, review submission, edit, and my-reviews routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Discovery Routes */}
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

        {/* Protected Payment Routes */}
        <Route
          path="bookings/:bookingId/payment"
          element={
            <ProtectedRoute>
              <CreatePayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/:paymentId"
          element={
            <ProtectedRoute>
              <PaymentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payments"
          element={
            <ProtectedRoute>
              <MyPayments />
            </ProtectedRoute>
          }
        />

        {/* Protected Review Routes */}
        <Route
          path="bookings/:bookingId/review"
          element={
            <ProtectedRoute>
              <CreateReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="reviews/:reviewId/edit"
          element={
            <ProtectedRoute>
              <EditReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-reviews"
          element={
            <ProtectedRoute>
              <MyReviews />
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
