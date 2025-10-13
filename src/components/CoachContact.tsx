'use client';

import { useState, useEffect } from 'react';

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
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="ml-3 text-muted-foreground">Loading coach information...</span>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Coach Assigned</h3>
        <p className="text-muted-foreground">You don't have a coach assigned yet. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coach Header */}
      <div className="text-center py-6">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{coach.name}</h1>
        <p className="text-muted-foreground">Your Personal Fitness Coach</p>
      </div>

      {/* Coach Bio */}
      {coach.bio && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">About Your Coach</h2>
          <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>
        </div>
      )}

      {/* Specialties */}
      {coach.specialties && coach.specialties.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {coach.specialties.map((specialty, index) => (
              <span key={index} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Methods */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Contact Methods</h2>
        <div className="space-y-3">
          {/* Email */}
          <button
            onClick={handleEmailContact}
            className="w-full flex items-center gap-4 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-foreground">Email</h3>
              <p className="text-sm text-muted-foreground">{coach.email}</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* WhatsApp */}
          {(coach.whatsapp || coach.phone) && (
            <button
              onClick={handleWhatsAppContact}
              className="w-full flex items-center gap-4 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">{coach.whatsapp || coach.phone}</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Phone */}
          {coach.phone && (
            <button
              onClick={handlePhoneCall}
              className="w-full flex items-center gap-4 p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">Phone Call</h3>
                <p className="text-sm text-muted-foreground">{coach.phone}</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Contact Tips</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p>For quick questions, WhatsApp is the fastest way to reach your coach.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p>For detailed questions about your plan, email works best.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p>Response time is typically within 24 hours during business days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
