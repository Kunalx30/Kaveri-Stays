import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Hotel, Grid, DoorClosed, Tag, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', to: '/management', icon: LayoutDashboard, end: true },
  { label: 'Properties', to: '/management/properties', icon: Hotel },
  { label: 'Room Types', to: '/management/room-types', icon: Grid },
  { label: 'Rooms', to: '/management/rooms', icon: DoorClosed },
  { label: 'Rate Plans', to: '/management/rate-plans', icon: Tag },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
];

const ManagementNav = () => {
  return (
    <div className="w-full bg-white border border-[#E6DFD5] rounded-2xl p-1.5 shadow-2xs mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex items-center space-x-1.5 min-w-max">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#16231E] text-white shadow-xs'
                    : 'text-[#5A635F] hover:text-[#16231E] hover:bg-[#F4EFEA]'
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
