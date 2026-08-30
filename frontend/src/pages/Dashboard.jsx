import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, Mail, Key, Building2, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await refreshUser();
      setSuccessMsg('User session successfully verified with backend /auth/me');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to refresh user profile from backend.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Authenticated Portal
              </span>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-black uppercase rounded-md border ${getRoleBadgeStyle(
                  user?.role
                )}`}
              >
                {user?.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome, {user?.full_name || 'Valued User'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Authentication successfully connected to backend (Phase F2).
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Verify /auth/me</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <ErrorMessage message={errorMsg} onDismiss={() => setErrorMsg('')} />
      </div>

      {/* Profile & Session Details Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
            <Mail className="w-4 h-4 text-blue-500" />
            <span>Email Address</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900 truncate">{user?.email}</div>
          <div className="text-[11px] text-slate-400">User ID: #{user?.user_id}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Role Assignment</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900 capitalize">{user?.role}</div>
          <div className="text-[11px] text-slate-400">
            Status: {user?.is_active ? 'Active Account' : 'Inactive'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Association</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {user?.property_id ? `Property #${user.property_id}` : user?.guest_id ? `Guest #${user.guest_id}` : 'Global Owner'}
          </div>
          <div className="text-[11px] text-slate-400">
            {user?.guest_id ? 'Linked Guest Record' : user?.property_id ? 'Property Isolated' : 'Full Portfolio Access'}
          </div>
        </div>
      </div>

      {/* JWT & Session Integration Verification Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
          <Key className="w-4 h-4 text-amber-400" />
          <span>JWT Security & Refresh Rotation</span>
        </div>
        <h2 className="text-xl font-bold text-white">Protected Session Active</h2>
        <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
          Your requests are automatically authenticated via Bearer tokens in Axios request headers. On expiration, the client interceptor seamlessly rotates tokens via <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300">/auth/refresh</code>.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
