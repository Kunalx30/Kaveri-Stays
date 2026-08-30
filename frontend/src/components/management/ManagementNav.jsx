import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Hotel, Grid, DoorClosed, Tag, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Overview', to: '/management', icon: LayoutDashboard, end: true },
  { label: 'Properties', to: '/management/properties', icon: Hotel },
  { label: 'Room Types', to: '/management/room-types', icon: Grid },
  { label: 'Rooms', to: '/management/rooms', icon: DoorClosed },
  { label: 'Rate Plans', to: '/management/rate-plans', icon: Tag },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
];

const ManagementNav = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex items-center space-x-1 min-w-max">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default ManagementNav;
