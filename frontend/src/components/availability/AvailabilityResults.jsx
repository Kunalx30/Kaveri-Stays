import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bed, Users, Star, ArrowRight, LogIn, CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import { getAvailabilityRoomImage } from '../../data/propertyMedia';

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
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          message: 'Please sign in to complete your room reservation.',
        },
      });
      return;
    }

    // Authenticated: navigate to create booking page with all the state
    navigate('/bookings/create', { state: { bookingIntent } });
  };

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════════
          SEARCH SUMMARY CONTEXT STRIP
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240]">
              Available Inventory
            </span>
            <span className="text-[#8A6240]">·</span>
            <span className="text-xs font-semibold text-[#16231E]">
              {total_available} {total_available === 1 ? 'Room' : 'Rooms'} Ready to Book
            </span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-normal text-[#16231E]">
            {formatDateDisplay(check_in)} — {formatDateDisplay(check_out)}
          </h3>
          <p className="text-xs text-[#5A635F]">
            {nights} {nights === 1 ? 'Night' : 'Nights'} · {guests_count} {guests_count === 1 ? 'Guest' : 'Guests'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6DFD5] text-[11px] font-semibold text-[#253B33] shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Live Availability Confirmed</span>
          </span>
        </div>
      </div>

      {/* Login notice for unauthenticated guests */}
      {!isAuthenticated && rooms.length > 0 && (
        <div className="bg-[#FDFCF8] border border-[#E6DFD5] rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-[#5A635F]">
          <div className="flex items-center space-x-2.5">
            <LogIn className="w-4 h-4 text-[#8A6240] shrink-0" />
            <span>
              Sign in or register to confirm your room reservation.
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          RESULTS LIST OR EMPTY STATE
          ══════════════════════════════════════════════════════════ */}
      {rooms.length === 0 ? (
        <EmptyState
          title="No Available Rooms for These Dates"
          message="All rooms for this destination are currently booked for your selected date range. Try shifting your dates by a few days or modifying guest counts to explore open accommodations."
        />
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => {
            const nightlyRate = Number(room.nightly_rate);
            const totalCost = nightlyRate ? nightlyRate * nights : null;
            const roomImage = getAvailabilityRoomImage(room);

            return (
              <article
                key={room.room_id}
                className="group bg-white rounded-2xl border border-[#E6DFD5] overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 grid grid-cols-1 md:grid-cols-12"
              >
                {/* Room Image Banner / Thumbnail (md: 4 cols) */}
                <div className="md:col-span-4 relative min-h-[200px] md:min-h-full overflow-hidden bg-[#F4EFEA]">
                  <img
                    src={roomImage}
                    alt={room.room_type_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-[11px] font-medium">
                    <MapPin className="w-3 h-3 text-amber-200" />
                    <span>{room.property_city}</span>
                  </div>
                </div>

                {/* Room Details & Pricing (md: 8 cols) */}
                <div className="md:col-span-8 p-6 sm:p-7 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-3">
                    {/* Property header & Star rating */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#8A6240]">
                        {room.property_name}
                      </span>
                      <div className="flex items-center space-x-1 text-amber-800 bg-[#F4EFEA] border border-[#E6DFD5] px-2 py-0.5 rounded text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{room.property_star_rating}.0 Star</span>
                      </div>
                    </div>

                    {/* Room Type & Room number */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-xl sm:text-2xl font-normal text-[#16231E]">
                          {room.room_type_name}
                        </h4>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A635F] bg-[#F4EFEA] px-2.5 py-1 rounded-md">
                          Room #{room.room_number}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A857F]">
                        Quiet riverside sanctuary with bespoke furnishings and private garden access.
                      </p>
                    </div>

                    {/* Specifications */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A635F] pt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#8A6240]" />
                        <span>Up to {room.max_occupancy} Guests</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-[#8A6240]" />
                        <span>Luxury Bedding</span>
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Selection Footer */}
                  <div className="pt-4 border-t border-[#E6DFD5] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      {room.nightly_rate ? (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-serif font-semibold text-[#16231E]">
                              {formatINR(room.nightly_rate)}
                            </span>
                            <span className="text-xs text-[#7A857F]">/ night</span>
                          </div>
                          {totalCost && (
                            <p className="text-xs font-medium text-[#253B33]">
                              Total stay: {formatINR(totalCost)} ({nights} nights)
                            </p>
                          )}
                          <p className="text-[10px] text-[#A0A8A3]">
                            Inclusive of local taxes and retreat amenities.
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-[#5A635F]">
                          Standard Seasonal Rate
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      id={`select-room-${room.room_id}`}
                      onClick={() => handleSelectRoom(room)}
                      className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      <span>{isAuthenticated ? 'Select Room' : 'Sign In & Reserve'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
                    </button>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailabilityResults;
