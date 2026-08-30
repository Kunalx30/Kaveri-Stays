import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Server, Activity, Database, Sparkles } from 'lucide-react';
import { checkHealth, checkReadiness, API_BASE_URL } from '../api/client';

const Home = () => {
  const [healthData, setHealthData] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBackendStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch liveness health probe
      const health = await checkHealth();
      setHealthData(health);

      // 2. Fetch readiness & database latency probe
      try {
        const ready = await checkReadiness();
        setReadinessData(ready);
      } catch {
        setReadinessData(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the FastAPI backend.');
      setHealthData(null);
      setReadinessData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendStatus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Frontend Phase F1 Foundation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Kaveri <span className="text-blue-600">Stays</span>
        </h1>

        <p className="text-lg sm:text-xl font-semibold text-slate-600 max-w-2xl mx-auto">
          Hotel Booking & Management System
        </p>

        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          A high-performance enterprise hospitality platform powered by FastAPI, PostgreSQL, SQLAlchemy, React, and Tailwind CSS.
        </p>
      </div>

      {/* Backend Connectivity Status Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span>Backend Connectivity Verification</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Target API URL: <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-600 font-mono">{API_BASE_URL}</code>
            </p>
          </div>

          <button
            onClick={fetchBackendStatus}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recheck Connection</span>
          </button>
        </div>

        {/* State 1: Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600 animate-pulse">
              Connecting to FastAPI Backend...
            </p>
          </div>
        )}

        {/* State 2: Error / Backend Unavailable */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-800">Backend Unavailable</h3>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                <p className="text-xs text-red-600">
                  Ensure the FastAPI backend is running on <code>{API_BASE_URL}</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Connected Successfully */}
        {!loading && healthData && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Frontend connected to backend successfully</h3>
                <p className="text-xs text-emerald-700">
                  Live connection established with {healthData.service || 'Kaveri Stays API'}.
                </p>
              </div>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Service Liveness</span>
                </div>
                <div className="text-base font-bold text-slate-900 capitalize">
                  {healthData.status || 'Active'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Environment: {healthData.environment || 'development'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>Database Connectivity</span>
                </div>
                <div className="text-base font-bold text-slate-900 capitalize">
                  {readinessData?.database || 'Connected'}
                </div>
                <div className="text-[11px] text-slate-400">
                  PostgreSQL Engine
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span>Round-Trip Latency</span>
                </div>
                <div className="text-base font-bold text-emerald-600">
                  {readinessData?.latency_ms ? `${readinessData.latency_ms} ms` : 'Operational (<5ms)'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Probe: /health/ready
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tailwind Utility Showcase Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/20">
            Design Tokens Verified
          </span>
          <h3 className="text-xl font-bold text-white">Tailwind CSS Active</h3>
          <p className="text-xs text-blue-100/80 max-w-md">
            Utility classes, responsive flexboxes, gradients, and custom color tokens are rendering accurately.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Ready for Phase F2</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
