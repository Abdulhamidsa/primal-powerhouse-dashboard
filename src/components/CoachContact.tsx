'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Check, Star } from 'lucide-react';

interface CoachContactProps {
  userId: string;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  specialties?: string[];
}

export default function CoachContact({ userId }: CoachContactProps) {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoachInfo();
  }, [userId]);

  const fetchCoachInfo = async () => {
    try {
      const response = await fetch(`/api/auth/me`);
      if (response.ok) {
        const userData = await response.json();
        if (userData.user.coach) {
          setCoach(userData.user.coach);
        }
      }
    } catch (error) {
      console.error('Error fetching coach info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContact = () => {
    if (coach?.email) {
      const subject = encodeURIComponent('Question about my fitness plan');
      const body = encodeURIComponent('Hi, I have a question about my fitness plan.\n\n');
      window.open(`mailto:${coach.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleWhatsAppContact = () => {
    if (coach?.whatsapp || coach?.phone) {
      const phoneNumber = (coach.whatsapp || coach.phone)?.replace(/[^\d]/g, '');
      const message = encodeURIComponent('Hi! I have a question about my fitness plan.');
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
  };

  const handlePhoneCall = () => {
    if (coach?.phone) {
      window.open(`tel:${coach.phone}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading coach info...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Coach Assigned</h3>
          <p className="text-slate-400 max-w-sm">
            You don&apos;t have a coach assigned yet. Contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Coach Profile */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">{coach.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{coach.name}</h1>
          <p className="text-slate-400">Your Personal Coach</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-2">Available for support</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white mb-4">Get in Touch</h2>

          {/* Email */}
          <button
            onClick={handleEmailContact}
            className="w-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-4 hover:from-blue-500/30 hover:to-cyan-600/30 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-white">Email</h3>
                <p className="text-sm text-slate-400">{coach.email}</p>
                <p className="text-xs text-slate-500 mt-1">Best for detailed questions</p>
              </div>
            </div>
          </button>

          {/* WhatsApp */}
          {(coach.whatsapp || coach.phone) && (
            <button
              onClick={handleWhatsAppContact}
              className="w-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-4 hover:from-green-500/30 hover:to-emerald-600/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white">WhatsApp</h3>
                  <p className="text-sm text-slate-400">{coach.whatsapp || coach.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">Quick responses</p>
                </div>
              </div>
            </button>
          )}

          {/* Phone */}
          {coach.phone && (
            <button
              onClick={handlePhoneCall}
              className="w-full bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white">Phone Call</h3>
                  <p className="text-sm text-slate-400">{coach.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">Direct conversation</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Response Time */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Response Time</h3>
              <p className="text-sm text-slate-400">Usually within 2-4 hours</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-3">Communication Tips</h3>
          <div className="space-y-2">
            {[
              'WhatsApp for quick questions and daily check-ins',
              'Email for detailed workout or nutrition questions',
              'Phone calls for urgent matters or consultations',
            ].map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-400">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
