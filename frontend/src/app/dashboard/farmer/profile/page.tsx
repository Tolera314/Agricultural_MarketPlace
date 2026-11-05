'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Menu,
  Loader2,
  Save,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCachedUserProfile } from '@/lib/auth';
import { onboardingApi } from '@/lib/onboardingApi';
import { farmerApi } from '@/lib/farmerApi';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function ProfilePage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const { user } = useAuth();
  const cachedUser = getCachedUserProfile();

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.fullName || cachedUser?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || cachedUser?.phone || '');
  const [email, setEmail] = useState(user?.email || cachedUser?.email || '');
  const [farmName, setFarmName] = useState('My Family Farm');
  const [region, setRegion] = useState('Oromia');
  const [woreda, setWoreda] = useState('Central District');
  const [bio, setBio] = useState('Specializing in organically produced seasonal crops and vegetables.');
  const [specialtiesText, setSpecialtiesText] = useState('Tomatoes, Red Onions, Sidama Coffee, Maize');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await onboardingApi.getStatus();
        const docs = (res.farmerProfile?.verificationDocuments as any) || {};
        if (res.fullName) setFullName(res.fullName);
        if (res.phone) setPhone(res.phone);
        if (res.email) setEmail(res.email);
        if (res.farmerProfile?.farmName) setFarmName(res.farmerProfile.farmName);
        if (res.farmerProfile?.farmDescription) setBio(res.farmerProfile.farmDescription);
        if (docs.region) setRegion(docs.region);
        if (docs.woreda) setWoreda(docs.woreda);
        if (Array.isArray(docs.specialties) && docs.specialties.length > 0) {
          setSpecialtiesText(docs.specialties.join(', '));
        }
      } catch (err) {
        if (user || cachedUser) {
          setFullName(user?.fullName || cachedUser?.fullName || 'Farmer');
          setPhone(user?.phone || cachedUser?.phone || '');
          setEmail(user?.email || cachedUser?.email || '');
        }
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const specialties = specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await farmerApi.updateProfile({
        fullName,
        phone,
        farmName,
        farmDescription: bio,
        region,
        woreda,
        specialties,
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || 'Failed to save profile changes');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  const specialtiesList = specialtiesText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Farm Profile & Credentials
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Manage public farm details, bio, and producer information
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saveSuccess ? 'Changes Saved!' : saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            Profile updated successfully and synced with AgriMarket directory.
          </div>
        )}

        {/* Banner Card */}
        <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xs overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-800 to-teal-700 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-[#0D2118] overflow-hidden relative shadow-md">
                <UserAvatar
                  name={fullName || 'Farmer'}
                  src={(user as any)?.avatarUrl}
                  size="xl"
                  className="w-full h-full text-2xl rounded-none"
                />
              </div>
            </div>
          </div>
          <div className="pt-12 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                  {fullName || 'Producer'}
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </h2>
                <p className="text-xs text-gray-500">{farmName} · Registered Producer</p>
              </div>
              <span className="self-start px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Verified Seller
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{region ? `${region}, ${woreda}` : 'Location pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{phone || 'No phone set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>{email || 'No email set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="bg-white dark:bg-[#0D2118] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xs p-6 space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-white">Farm Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Full Name / Primary Contact</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Abebe Balcha"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +251 911 234 567"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Farm / Holding Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Green Highland Valley Farm"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 mb-1 block">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Oromia, Sidama, Amhara"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-500 mb-1 block">Woreda / Kebele</label>
            <input
              type="text"
              value={woreda}
              onChange={(e) => setWoreda(e.target.value)}
              placeholder="e.g. Sebeta District, Kebele 02"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-gray-500 mb-1 block">Farm Bio & Produce Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your soil, harvest seasons, and agricultural methods..."
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <label className="font-bold text-gray-500 mb-1 block">Crops & Specialties (Comma-separated)</label>
            <input
              type="text"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
              placeholder="e.g. Tomatoes, Red Onions, Sidama Coffee, Yellow Maize"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold focus:outline-none focus:border-emerald-500 mb-3"
            />

            <div className="flex flex-wrap gap-2">
              {specialtiesList.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
