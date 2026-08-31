import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, UserPlus, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
      };

      await register(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', '));
      } else {
        setError('Registration failed. Please verify your information and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E6DFD5] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ── LEFT VISUAL COLUMN (Desktop only, 5 cols) ── */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between relative overflow-hidden p-10 text-white min-h-[620px]">
          <img
            src="/images/hotel2.png"
            alt="Kaveri Stays sanctuary"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80" />

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Guest Membership</span>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10 space-y-3">
            <h2 className="font-serif text-3xl font-normal leading-snug text-white">
              Begin your journey <br />
              <span className="italic text-amber-100">along the Kaveri.</span>
            </h2>
            <p className="text-xs text-white/80 leading-relaxed font-light">
              Create your guest account to manage reservations, receive tailored host assistance, and secure live room availability.
            </p>
          </div>
        </div>

        {/* ── RIGHT REGISTRATION FORM COLUMN (7 cols) ── */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
              Guest Registration
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E]">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-[#5A635F] font-light">
              Join Kaveri Stays to discover and book boutique river sanctuaries.
            </p>
          </div>

          <ErrorMessage message={error} onDismiss={() => setError('')} />

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A857F]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  minLength={2}
                  maxLength={150}
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Aarav Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-sm text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A857F]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-sm text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
                Password * (Min. 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A857F]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-sm text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A857F] hover:text-[#16231E] cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone & City (Split on sm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A857F]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-sm text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
                  City / Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A857F]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Bangalore"
                    className="w-full pl-10 pr-4 py-3 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-sm text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-200" />
                  <span>Create Guest Account</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#5A635F] pt-2 border-t border-[#E6DFD5]">
            Already registered with us?{' '}
            <Link to="/login" className="font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors underline underline-offset-4">
              Sign In
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;
