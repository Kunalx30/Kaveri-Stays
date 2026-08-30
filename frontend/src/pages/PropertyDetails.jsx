import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Hotel, MapPin, Star, Calendar, ArrowLeft, Users, ShieldCheck, Waves, Coffee, Wifi, Sparkles, Loader2 } from 'lucide-react';
import { getPropertyByIdApi, getRoomTypesApi } from '../api/properties';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const [propData, typesData] = await Promise.all([
          getPropertyByIdApi(propertyId),
          getRoomTypesApi(),
        ]);
        setProperty(propData);
        setRoomTypes(typesData);
      } catch (err) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : `Property with ID #${propertyId} could not be found.`);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchDetails();
    }
  }, [propertyId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <div>
        <Link
          to="/properties"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Properties</span>
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading property details...</p>
        </div>
      )}

      {!loading && error && (
        <EmptyState
          title="Property Not Found"
          message={`Unable to load property details for ID #${propertyId}. It may have been removed or does not exist.`}
          actionLabel="Browse All Properties"
          onAction={() => window.location.assign('/properties')}
        />
      )}

      {!loading && property && (
        <div className="space-y-8">
          {/* Main Hero Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Hotel className="w-3.5 h-3.5" />
                  <span>Kaveri Stays Certified Resort</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {property.name}
                </h1>

                <p className="text-sm text-slate-500 flex items-center space-x-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{property.city}, Karnataka</span>
                </p>
              </div>

              {/* Star Rating Badge */}
              <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl self-start sm:self-auto">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span className="text-lg font-black text-amber-900">{property.star_rating}.0</span>
                <span className="text-xs text-amber-700 font-semibold">/ 5 Star Luxury</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              Nestled on the serene banks of the river Kaveri, <strong>{property.name}</strong> blends timeless regional architecture with modern luxury. Enjoy picturesque water views, manicured gardens, fine dining, and warm hospitality.
            </p>

            {/* Property Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Waves className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Riverfront View</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Wifi className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>High-Speed WiFi</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Gourmet Breakfast</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>24/7 Security</span>
              </div>
            </div>

            {/* Check Availability CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Planning your vacation?</span>
                </h3>
                <p className="text-xs text-blue-100/80">
                  Search live available rooms and view dynamic seasonal rates for your preferred dates.
                </p>
              </div>

              <Link
                to={`/properties/${property.property_id}/availability`}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-blue-900 bg-white hover:bg-blue-50 shadow-md shadow-black/10 transition-all hover:scale-105 shrink-0"
              >
                <Calendar className="w-4 h-4" />
                <span>Check Availability at this Hotel</span>
              </Link>
            </div>
          </div>

          {/* Room Categories & Types Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Room Categories & Accommodations</h2>
              <p className="text-xs text-slate-500">
                Explore the room types offered across our properties.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {roomTypes.map((rt) => (
                <div
                  key={rt.room_type_id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">{rt.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Category #{rt.room_type_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Up to <strong>{rt.max_occupancy}</strong> Guests Capacity</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thoughtfully designed with plush bedding, private balcony access, and climate control.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
