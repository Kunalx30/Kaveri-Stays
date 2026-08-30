import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bed, Users, Hotel, CheckCircle, Star, CalendarCheck, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';

/**
 * AvailabilityResults
 *
 * Renders the list of rooms returned by the backend availability API.
 * On "Select Room":
 *   - If NOT authenticated → redirect to /login, preserving booking intent in state.
 *   - If authenticated → navigate to /bookings/create with room + search data.
 *
 * Does NOT calculate final prices. Shows backend-provided nightly_rate for display only.
 * The backend resolves the authoritative nightly_rate on booking creation.
 */
const AvailabilityResults = ({ results }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!results) return null;

  const { check_in, check_out, guests_count, total_available, rooms = [] } = results;

  const calculateNights = (inDate, outDate) => {
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diffTime = Math.abs(end - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights(check_in, check_out);

  const formatINR = (val) => {
    if (val === null || val === undefined) return null;
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const handleSelectRoom = (room) => {
    // Build booking intent to carry through the flow
    const bookingIntent = {
      room_id: room.room_id,
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      room_type_name: room.room_type_name,
      max_occupancy: room.max_occupancy,
      property_id: room.property_id,
      property_name: room.property_name,
      property_city: room.property_city,
      property_star_rating: room.property_star_rating,
      check_in_date: check_in,
      check_out_date: check_out,
      guests_count: guests_count,
      nightly_rate: room.nightly_rate, // Display hint only; backend re-resolves on booking
    };

    if (!isAuthenticated) {
      // Redirect to login, preserving intent so user returns here after login
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          bookingIntent,
          message: 'Please sign in to complete your room booking.',
        },
      });
      return;
    }

    // Authenticated: navigate to create booking page with all the state
    navigate('/bookings/create', { state: { bookingIntent } });
  };

  return (
    <div className="space-y-6">
      {/* Search Summary Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
        <div className="space-y-0.5">
          <h3 className="text-sm font-extrabold text-blue-950 flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Search Results: {total_available} Room{total_available === 1 ? '' : 's'} Available</span>
          </h3>
          <p className="text-xs text-blue-800">
            Dates: <strong className="font-bold">{check_in}</strong> to{' '}
            <strong className="font-bold">{check_out}</strong> ({nights} night{nights === 1 ? '' : 's'}) •{' '}
            {guests_count} Guest{guests_count === 1 ? '' : 's'}
          </p>
        </div>

        <div className="text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 self-start sm:self-auto">
          PostgreSQL Range Verified
        </div>
      </div>

      {/* Login nudge for unauthenticated users */}
      {!isAuthenticated && rooms.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-xs text-amber-800">
          <LogIn className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Sign in</strong> to select a room and complete your booking reservation.
          </span>
        </div>
      )}

      {/* Results Grid or Empty State */}
      {rooms.length === 0 ? (
        <EmptyState
          title="No Available Rooms for Selected Dates"
          message="All rooms for this property or criteria are currently booked for the chosen date range. Please try selecting different dates or adjusting your guest count."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const nightlyRate = Number(room.nightly_rate);
            const totalCost = nightlyRate ? nightlyRate * nights : null;

            return (
              <div
                key={room.room_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Property & Rating */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-600 font-semibold truncate">
                      <Hotel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{room.property_name} ({room.property_city})</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span className="text-[11px] font-bold text-amber-900">{room.property_star_rating}.0</span>
                    </div>
                  </div>

                  {/* Room Type & Number */}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{room.room_type_name}</h4>
                    <span className="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1">
                      Room #{room.room_number}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max {room.max_occupancy} Guests</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>Luxury Accommodation</span>
                    </span>
                  </div>
                </div>

                {/* Pricing & Selection */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    {room.nightly_rate ? (
                      <div>
                        <div className="text-lg font-black text-slate-900">
                          {formatINR(room.nightly_rate)}
                          <span className="text-xs font-normal text-slate-400"> / night</span>
                        </div>
                        {totalCost && (
                          <div className="text-[11px] font-semibold text-emerald-700">
                            Est. {formatINR(totalCost)} ({nights} nights)
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Final price confirmed by server at booking.
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-500">Standard Seasonal Rate</div>
                    )}
                  </div>

                  <button
                    type="button"
                    id={`select-room-${room.room_id}`}
                    onClick={() => handleSelectRoom(room)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isAuthenticated ? 'Select Room' : 'Sign In & Book'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailabilityResults;
