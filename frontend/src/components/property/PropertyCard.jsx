import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, ArrowRight, Hotel } from 'lucide-react';

const PropertyCard = ({ property }) => {
  if (!property) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between group">
      <div className="p-6 space-y-4">
        {/* Top Header & Star Rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="text-xs font-black text-amber-900">{property.star_rating}.0</span>
            <span className="text-[10px] text-amber-700 font-semibold">Star</span>
          </div>
        </div>

        {/* Property Name & City */}
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
            {property.name}
          </h3>
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{property.city}</span>
          </p>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Premium riverside property offering world-class comfort, scenic views, and verified hospitality standards.
        </p>
      </div>

      {/* Card Actions Footer */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={`/properties/${property.property_id}`}
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <Link
          to={`/properties/${property.property_id}/availability`}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Check Dates</span>
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
