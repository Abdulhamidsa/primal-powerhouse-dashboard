'use client';


import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserMeals from '@/components/UserMeals';
import UserVideos from '@/components/UserVideos';
import CoachContact from '@/components/CoachContact';

// @ts-ignore - lucide-react type definitions issue
import { HouseIcon as Home, ForkKnifeIcon as Utensils, PlayIcon as Play, UserIcon as User, SignOutIcon as LogOut } from '@phosphor-icons/react';

interface User {
  id: string;
  name: string;
  email: string;
  coach: {
    name: string;
    email: string;
  };
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/user/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">Hi, {user?.name?.split(' ')[0]}</h1>
              <p className="text-slate-400 text-sm">Ready to crush your goals?</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <LogOut aria-hidden="true" focusable="false" size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeSection === 'home' && (
          <div className="p-4 space-y-6">
            {/* Welcome Quote */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl"><ArrowsClockwiseIcon className="h-[1em] w-[1em]" aria-hidden="true" /></span>
                </div>
                <blockquote className="text-lg font-medium text-white mb-2">
                  &quot;Success is the sum of small efforts repeated day in and day out.&quot;
                </blockquote>
                <p className="text-slate-400 text-sm">- Robert Collier</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveSection('meals')}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 text-left hover:from-green-500/30 hover:to-emerald-600/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Utensils aria-hidden="true" focusable="false" className="text-green-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-1">Nutrition</h3>
                <p className="text-slate-400 text-sm">View meal plans</p>
              </button>

              <button
                onClick={() => setActiveSection('videos')}
                className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 text-left hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Play aria-hidden="true" focusable="false" className="text-purple-400" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-1">Training</h3>
                <p className="text-slate-400 text-sm">Watch workouts</p>
              </button>
            </div>

            {/* Coach Card */}
            <button
              onClick={() => setActiveSection('coach')}
              className="w-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-6 text-left hover:from-blue-500/30 hover:to-cyan-600/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <User aria-hidden="true" focusable="false" className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Your Coach</h3>
                  <p className="text-slate-400 text-sm">{user?.coach?.name || 'Get in touch'}</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {activeSection === 'meals' && user && <UserMeals userId={user.id} />}
        {activeSection === 'videos' && user && <UserVideos userId={user.id} />}
        {activeSection === 'coach' && user && <CoachContact userId={user.id} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveSection('home')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeSection === 'home' ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home aria-hidden="true" focusable="false" size={20} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveSection('meals')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeSection === 'meals' ? 'text-green-400 bg-green-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils aria-hidden="true" focusable="false" size={20} />
            <span className="text-xs font-medium">Meals</span>
          </button>

          <button
            onClick={() => setActiveSection('videos')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeSection === 'videos' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play aria-hidden="true" focusable="false" size={20} />
            <span className="text-xs font-medium">Training</span>
          </button>

          <button
            onClick={() => setActiveSection('coach')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              activeSection === 'coach' ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User aria-hidden="true" focusable="false" size={20} />
            <span className="text-xs font-medium">Coach</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
