'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OrderHistory from './OrderHistory';
import AddressBook from './AddressBook';
import { supabase } from '@/lib/supabase';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Update active tab when URL param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'orders', 'addresses', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      setProfileData({
        firstName: session.user.user_metadata?.first_name || '',
        lastName: session.user.user_metadata?.last_name || '',
        email: session.user.email || '',
        phone: session.user.phone || ''
      });
      setLoading(false);
    }
    checkUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone
        }
      });
      if (error) throw error;
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.password.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.password });
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#B8860B]" />
      </div>
    );
  }

  const navItems = [
    { id: 'profile', icon: 'ri-user-settings-line', label: 'Profile' },
    { id: 'orders', icon: 'ri-shopping-bag-3-line', label: 'Orders' },
    { id: 'addresses', icon: 'ri-map-pin-2-line', label: 'Addresses' },
    { id: 'security', icon: 'ri-shield-keyhole-line', label: 'Security' }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-12 pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-[#B8860B] text-xs font-bold uppercase tracking-widest mb-1 block">My Account</span>
            <h1 className="font-serif text-3xl md:text-4xl text-[#050505]">
              Hello, {profileData.firstName || 'Guest'}
            </h1>
            <p className="text-neutral-500 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-full hover:border-[#B8860B] hover:text-[#B8860B] transition-colors"
          >
            <i className="ri-logout-box-r-line text-lg" />
            <span className="text-sm font-semibold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24 border border-neutral-100">
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all text-left ${activeTab === item.id
                        ? 'bg-[#050505] text-white shadow-lg'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-[#050505]'
                      }`}
                  >
                    <i className={`${item.icon} text-xl ${activeTab === item.id ? 'text-[#B8860B]' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-10 min-h-[500px]">

              {activeTab === 'profile' && (
                <div className="max-w-2xl animate-fade-in-up">
                  <h2 className="font-serif text-2xl text-[#050505] mb-2">Personal Information</h2>
                  <p className="text-neutral-500 mb-8">Manage your personal details.</p>

                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${profileMessage.type === 'success' ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'bg-red-50 text-red-600'}`}>
                      <i className={profileMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} />
                      {profileMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">First Name</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full border-b-2 border-neutral-200 py-3 bg-transparent focus:border-[#B8860B] focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Last Name</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full border-b-2 border-neutral-200 py-3 bg-transparent focus:border-[#B8860B] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full border-b-2 border-neutral-100 py-3 bg-transparent text-neutral-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full border-b-2 border-neutral-200 py-3 bg-transparent focus:border-[#B8860B] focus:outline-none transition-colors"
                        placeholder="+233..."
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-[#050505] text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-colors disabled:opacity-50"
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>

                  <div className="mt-16 pt-16 border-t border-neutral-100">
                    <h3 className="font-serif text-2xl text-[#050505] mb-2">Change Password</h3>
                    <p className="text-neutral-500 mb-8">Update your password securely.</p>

                    {passwordMessage.text && (
                      <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${passwordMessage.type === 'success' ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'bg-red-50 text-red-600'}`}>
                        <i className={passwordMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} />
                        {passwordMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">New Password</label>
                          <input
                            type="password"
                            value={passwordData.password}
                            onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                            className="w-full border-b-2 border-neutral-200 py-3 bg-transparent focus:border-[#B8860B] focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Confirm Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full border-b-2 border-neutral-200 py-3 bg-transparent focus:border-[#B8860B] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="bg-white border-2 border-neutral-200 text-[#050505] px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:border-[#050505] transition-colors disabled:opacity-50"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && <OrderHistory />}
              {activeTab === 'addresses' && <AddressBook />}
              {activeTab === 'security' && (
                <div className="animate-fade-in-up">
                  <h2 className="font-serif text-2xl text-[#050505] mb-2">Security</h2>
                  <p className="text-neutral-500 mb-8">Manage your account security.</p>
                  {/* Simplified Security View for consistency */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {['Email', 'Phone'].map((type) => (
                      <div key={type} className="p-6 border border-neutral-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#B8860B]/10 flex items-center justify-center rounded-full text-[#B8860B]">
                            <i className={type === 'Email' ? 'ri-mail-line' : 'ri-phone-line'} />
                          </div>
                          <div>
                            <p className="font-bold text-[#050505]">{type}</p>
                            <p className="text-sm text-neutral-500">{type === 'Email' ? user?.email : user?.phone || 'Not set'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold uppercase text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          {type === 'Email' && user?.email_confirmed_at ? 'Verified' : type === 'Phone' && user?.phone_confirmed_at ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#B8860B]" />
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
