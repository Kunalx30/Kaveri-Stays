import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Calendar } from 'lucide-react';
import { getPropertyCardImage } from '../../data/propertyMedia';
import { getPropertyContent } from '../../data/propertyContent';

const PropertyCard = ({ property }) => {
  if (!property) return null;

  const photo = getPropertyCardImage(property.property_id);
  const content = getPropertyContent(property.property_id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-[#FBF9F5] border border-[#E6DFD5] hover:shadow-md transition-shadow duration-300">

      {/* ── Image ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={photo}
          alt={`${property.name} — ${property.city}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Bottom fade — only enough for the star chip */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Star rating — bottom left over the gradient */}
        <div className="absolute bottom-3 left-4 flex items-center space-x-1 text-white">
          <span className="text-amber-300 text-xs leading-none">★</span>
          <span className="text-[12px] font-semibold leading-none">
            {property.star_rating}.0
          </span>
        </div>

        {/* City chip — bottom right */}
        <div className="absolute bottom-3 right-4 flex items-center space-x-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
          <MapPin className="w-3 h-3 text-white/80 shrink-0" />
          <span className="text-[11px] text-white/90 font-medium leading-none">
            {property.city}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Property name */}
        <h3 className="font-serif text-xl font-normal text-[#16231E] leading-snug mb-1.5 group-hover:text-[#253B33] transition-colors duration-200">
          {property.name}
        </h3>

        {/* Supporting text — property-specific short description */}
        <p className="text-[13px] text-[#7A857F] leading-relaxed mb-5 line-clamp-3">
          {content.short_description}
        </p>

        {/* ── Actions ── */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#E6DFD5]">
          {/* Secondary — text link */}
          <Link
            to={`/properties/${property.property_id}`}
            className="inline-flex items-center space-x-1 text-[12px] font-medium text-[#5A635F] hover:text-[#16231E] transition-colors group/link"
            aria-label={`View details for ${property.name}`}
          >
            <span>Explore Stay</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </Link>

          {/* Primary — refined button */}
          <Link
            to={`/properties/${property.property_id}/availability`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors duration-200"
            aria-label={`Check availability for ${property.name}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Check Availability</span>
          </Link>
        </div>
      </div>

    </article>
  );
};

export default PropertyCard;
