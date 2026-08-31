import React from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#16231E] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">

          {/* Brand */}
          <div className="space-y-3 max-w-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                <Waves className="w-4 h-4 text-amber-300" />
              </div>
              <div className="leading-none">
                <span className="font-serif text-xl font-bold text-white tracking-tight block">
                  Kaveri Stays
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-amber-300/70 font-medium mt-0.5 block">
                  Riverside Retreats
                </span>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-light">
              Thoughtful stays, closer to nature.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="flex flex-col sm:flex-row gap-8">
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Discover</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/properties" className="text-sm text-white/60 hover:text-white transition-colors">
                    Explore Stays
                  </Link>
                </li>
                <li>
                  <Link to="/availability" className="text-sm text-white/60 hover:text-white transition-colors">
                    Check Availability
                  </Link>
                </li>
              </ul>
            </div>

            {isAuthenticated && (
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40">My Account</h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link to="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-bookings" className="text-sm text-white/60 hover:text-white transition-colors">
                      My Bookings
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-reviews" className="text-sm text-white/60 hover:text-white transition-colors">
                      My Reviews
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/35">
            &copy; {year} Kaveri Stays. All rights reserved.
          </p>
          <p className="text-[11px] text-white/25 italic">
            Hand-inspected riverside sanctuaries.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
