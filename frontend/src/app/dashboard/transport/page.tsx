'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronRight,
  Menu,
  Navigation,
  Loader2,
  Package,
  Plus,
  Scale,
  Snowflake,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Check,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { logisticsApi } from '@/lib/logisticsApi';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function TransportPortalPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'fleet'>('available');
  const [profile, setProfile] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableShipments, setAvailableShipments] = useState<any[]>([]);
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    businessLicenseNo: '',
    tinNumber: '',
    contactPhone: '',
    contactEmail: '',
    operatingCities: 'Addis Ababa, Hawassa, Adama, Bahir Dar',
  });

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    category: 'MEDIUM_DUTY_TRUCK',
    payloadCapacityKg: 5000,
    usableCargoVolumeM3: 16,
    hasRefrigeration: false,
    makeModel: 'Isuzu NPR 400',
    yearOfManufacture: 2022,
  });

  const [acceptModalShipment, setAcceptModalShipment] = useState<any | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const [milestoneModalShipment, setMilestoneModalShipment] = useState<any | null>(null);
  const [nextMilestoneStatus, setNextMilestoneStatus] = useState('IN_TRANSIT');
  const [milestoneNotes, setMilestoneNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadPortalData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, vehRes, availRes] = await Promise.all([
        logisticsApi.getProviderProfile().catch(() => ({ success: false, data: null })),
        logisticsApi.getVehicles().catch(() => ({ success: false, data: [] })),
        logisticsApi.getAvailableShipments().catch(() => ({ success: false, data: [] })),
      ]);

      if (profRes?.success && profRes.data) {
        setProfile(profRes.data);
      }
      if (vehRes?.success && Array.isArray(vehRes.data)) {
        setVehicles(vehRes.data);
        if (vehRes.data.length > 0) setSelectedVehicleId(vehRes.data[0].id);
      }
      if (availRes?.success && Array.isArray(availRes.data)) {
        setAvailableShipments(availRes.data.filter((s: any) => s.status === 'REQUESTED'));
        setActiveShipments(availRes.data.filter((s: any) => s.status !== 'REQUESTED'));
      }
    } catch (err) {
      console.error('Failed to load transport portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Provider Registration
  const handleRegisterProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const cities = registerForm.operatingCities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      await logisticsApi.registerProvider({
        companyName: registerForm.companyName,
        businessLicenseNo: registerForm.businessLicenseNo || undefined,
        tinNumber: registerForm.tinNumber || undefined,
        contactPhone: registerForm.contactPhone,
        contactEmail: registerForm.contactEmail || undefined,
        operatingCities: cities,
      });
      showNotification('Commercial carrier registration submitted for verification!');
      setIsRegisterModalOpen(false);
      loadPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Registration failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await logisticsApi.addVehicle({
        plateNumber: vehicleForm.plateNumber.toUpperCase().trim(),
        category: vehicleForm.category,
        payloadCapacityKg: Number(vehicleForm.payloadCapacityKg),
        usableCargoVolumeM3: Number(vehicleForm.usableCargoVolumeM3),
        hasRefrigeration: vehicleForm.hasRefrigeration,
        makeModel: vehicleForm.makeModel,
        yearOfManufacture: Number(vehicleForm.yearOfManufacture),
      });
      showNotification('Freight vehicle registered successfully!');
      setIsAddVehicleOpen(false);
      loadPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to add vehicle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Accept Shipment
  const handleAcceptShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalShipment) return;
    if (!selectedVehicleId) {
      showNotification('Please select a registered vehicle from your fleet.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await logisticsApi.acceptShipment(acceptModalShipment.id, selectedVehicleId);
      showNotification('Freight shipment accepted! Dispatch order scheduled.');
      setAcceptModalShipment(null);
      loadPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to accept shipment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Milestone Progress
  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneModalShipment) return;
    setActionLoading(true);
    try {
      await logisticsApi.updateMilestone(milestoneModalShipment.id, {
        status: nextMilestoneStatus,
        notes: milestoneNotes || `Advanced to ${nextMilestoneStatus} by carrier dispatch`,
      });
      showNotification(`Shipment milestone updated to ${nextMilestoneStatus.replace(/_/g, ' ')}!`);
      setMilestoneModalShipment(null);
      loadPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update milestone.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F4F6F5] dark:bg-[#0B1512] flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              Transport Provider & Freight Fleet Portal
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inter-City Freight Dispatch • Fleet Governance • Corridors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard/worker"
            className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Worker Switch
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Carrier Profile Banner */}
        <div className="bg-white dark:bg-[#0D2118] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {profile?.companyName || 'Unregistered Commercial Carrier'}
              </h2>
              {profile?.verificationStatus === 'VERIFIED' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED CARRIER
                </span>
              ) : profile ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {profile.verificationStatus}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-600">
                  NOT ENROLLED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Operating Corridors: {profile?.operatingCities?.join(', ') || 'Addis Ababa, Hawassa, Adama, Bahir Dar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!profile && (
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Register Carrier Company
              </button>
            )}
            <button
              onClick={() => setIsAddVehicleOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Fleet Vehicle
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D2118] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            <span>Available Freight Board</span>
            {availableShipments.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                {availableShipments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D2118] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            <span>Active Runs ({activeShipments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fleet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D2118] text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            <span>Vehicle Fleet ({vehicles.length})</span>
          </button>
        </div>

        {/* TAB 1: AVAILABLE FREIGHT BOARD */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Scanning regional freight demand...</p>
              </div>
            ) : availableShipments.length === 0 ? (
              <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">No pending freight shipments</h3>
                <p className="text-xs text-gray-500 max-w-md">
                  All inter-city bulk orders are currently assigned or in transit. Check back as new harvests are confirmed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white font-mono">
                          #{shipment.trackingNumber}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                            ETB {shipment.agreedCost?.toLocaleString() || '12,500'}
                          </span>
                          <span className="text-[10px] text-gray-400">Guaranteed Carrier Payout</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#11241B]">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Origin City</span>
                          <span className="font-bold text-gray-800 dark:text-white">{shipment.originCity}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#11241B]">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Destination</span>
                          <span className="font-bold text-gray-800 dark:text-white">{shipment.destinationCity}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" />
                          {shipment.totalWeightKg?.toLocaleString()} kg
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-bold">
                          {shipment.totalVolumeM3 || 12} m³ Volume
                        </span>
                        {shipment.requiresRefrigeration && (
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold flex items-center gap-1">
                            <Snowflake className="w-3.5 h-3.5" />
                            Cold-Chain Truck
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                          {shipment.pickups?.length || 1} Farm Gate Pickups
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setAcceptModalShipment(shipment);
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Freight Run</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE FREIGHT RUNS */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeShipments.length === 0 ? (
              <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">No active runs in transit</h3>
                <p className="text-xs text-gray-500 max-w-md">
                  Accept shipments from the Available Freight board to start active corridor transport.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white font-mono">
                            Waybill #{shipment.trackingNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {shipment.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Route: {shipment.originCity} ➔ {shipment.destinationCity} ({shipment.totalWeightKg} kg)
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setMilestoneModalShipment(shipment);
                            const nextMap: Record<string, string> = {
                              SCHEDULED: 'PICKUP_IN_PROGRESS',
                              PICKUP_IN_PROGRESS: 'LOADING',
                              LOADING: 'IN_TRANSIT',
                              IN_TRANSIT: 'ARRIVED',
                              ARRIVED: 'DELIVERED',
                            };
                            setNextMilestoneStatus(nextMap[shipment.status] || 'IN_TRANSIT');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Advance Milestone</span>
                        </button>
                      </div>
                    </div>

                    {/* Assigned Vehicle & Driver */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-[#11241B] p-3 rounded-xl">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Assigned Vehicle</span>
                        <span className="font-bold text-gray-800 dark:text-white">
                          Plate: {shipment.vehicle?.plateNumber || 'Truck Assigned'} ({shipment.vehicle?.category})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Driver Contact</span>
                        <span className="font-bold text-gray-800 dark:text-white">
                          {shipment.driver?.fullName || 'Carrier Dispatch'} ({shipment.driver?.phone || '+251 91 100 0000'})
                        </span>
                      </div>
                    </div>

                    {/* Farm Gate Stops Progress */}
                    {shipment.pickups?.length > 0 && (
                      <div className="space-y-1.5 text-xs">
                        <div className="font-bold text-gray-700 dark:text-gray-300">Corridor Farm Gate Stops:</div>
                        <div className="space-y-1">
                          {shipment.pickups.map((pk: any, idx: number) => (
                            <div
                              key={pk.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#11241B] text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600">#{idx + 1}</span>
                                <span>{pk.farmLocation}</span>
                                <span className="text-gray-400">({pk.allocatedWeightKg} kg)</span>
                              </div>
                              <div>
                                {pk.farmerConfirmed ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Handover Complete
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Pending Loading
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FLEET & VEHICLES */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">No vehicles enrolled in fleet</h3>
                <p className="text-xs text-gray-500 max-w-md">
                  Register commercial trucks, vans, and refrigerated vehicles to accept bulk agricultural freight.
                </p>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Register First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                        {v.plateNumber}
                      </span>
                      {v.verificationStatus === 'VERIFIED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {v.verificationStatus}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <div>
                        <strong>Category:</strong> {v.category?.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <strong>Payload Capacity:</strong> {v.payloadCapacityKg?.toLocaleString()} kg
                      </div>
                      <div>
                        <strong>Cargo Volume:</strong> {v.usableCargoVolumeM3} m³
                      </div>
                      <div>
                        <strong>Make / Model:</strong> {v.makeModel || 'Commercial Truck'}
                      </div>
                      {v.hasRefrigeration && (
                        <div className="text-cyan-700 dark:text-cyan-300 font-bold flex items-center gap-1">
                          <Snowflake className="w-3.5 h-3.5" />
                          Refrigerated Cold-Chain Telemetry
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL: REGISTER PROVIDER ──────────────────────────────── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Register Commercial Carrier Company
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterProvider} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Company / Carrier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abyssinia Agro Freight Logistics"
                  value={registerForm.companyName}
                  onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Business License #</label>
                  <input
                    type="text"
                    placeholder="BL-ET-2024"
                    value={registerForm.businessLicenseNo}
                    onChange={(e) => setRegisterForm({ ...registerForm, businessLicenseNo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">TIN Number</label>
                  <input
                    type="text"
                    placeholder="0048192841"
                    value={registerForm.tinNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, tinNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Dispatch Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+251 91 123 4567"
                  value={registerForm.contactPhone}
                  onChange={(e) => setRegisterForm({ ...registerForm, contactPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Operating Cities / Corridors (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={registerForm.operatingCities}
                  onChange={(e) => setRegisterForm({ ...registerForm, operatingCities: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Submitting...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD VEHICLE ────────────────────────────────────── */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Add Vehicle to Freight Fleet
              </h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">License Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ET-3-A99482"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Vehicle Category</label>
                <select
                  value={vehicleForm.category}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                >
                  <option value="LIGHT_DUTY_TRUCK">Light Duty Truck (Up to 3,500 kg)</option>
                  <option value="MEDIUM_DUTY_TRUCK">Medium Duty Truck (Up to 8,000 kg)</option>
                  <option value="HEAVY_DUTY_TRUCK">Heavy Duty Semi-Trailer (Up to 24,000 kg)</option>
                  <option value="REFRIGERATED_TRUCK">Refrigerated Truck (Cold-Chain Active)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Payload Limit (kg)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    value={vehicleForm.payloadCapacityKg}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, payloadCapacityKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Usable Volume (m³)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={vehicleForm.usableCargoVolumeM3}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, usableCargoVolumeM3: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Make / Model</label>
                  <input
                    type="text"
                    placeholder="Isuzu NPR 400"
                    value={vehicleForm.makeModel}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    value={vehicleForm.yearOfManufacture}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, yearOfManufacture: parseInt(e.target.value, 10) || 2020 })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vehicleForm.hasRefrigeration}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, hasRefrigeration: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-950 dark:text-cyan-200 font-bold">
                    Refrigerated Thermal Container (Cold-Chain Qualified)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ACCEPT SHIPMENT ─────────────────────────────────── */}
      {acceptModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Dispatch Truck for #{acceptModalShipment.trackingNumber}
              </h3>
              <button onClick={() => setAcceptModalShipment(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAcceptShipment} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 space-y-1">
                <div>Route: {acceptModalShipment.originCity} ➔ {acceptModalShipment.destinationCity}</div>
                <div>Cargo Weight: {acceptModalShipment.totalWeightKg} kg</div>
                <div>Guaranteed Transport Payout: ETB {acceptModalShipment.agreedCost?.toLocaleString()}</div>
              </div>

              <div>
                <label className="block font-bold mb-1">Select Fleet Vehicle</label>
                {vehicles.length === 0 ? (
                  <p className="text-red-500">No vehicles available. Please add a vehicle first.</p>
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.category?.replace(/_/g, ' ')} ({v.payloadCapacityKg} kg max)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setAcceptModalShipment(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || vehicles.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Dispatch Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADVANCE MILESTONE ───────────────────────────────── */}
      {milestoneModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Log Shipment Milestone
              </h3>
              <button onClick={() => setMilestoneModalShipment(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">New Milestone Status</label>
                <select
                  value={nextMilestoneStatus}
                  onChange={(e) => setNextMilestoneStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                >
                  <option value="PICKUP_IN_PROGRESS">Pickup in Progress (Departed to farm corridor)</option>
                  <option value="LOADING">Loading (At farm gate scale)</option>
                  <option value="IN_TRANSIT">In Transit (Highway corridor transit)</option>
                  <option value="ARRIVED">Arrived (At buyer receiving facility)</option>
                  <option value="DELIVERED">Delivered (Completed offloading)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Milestone Notes / Location Remark</label>
                <textarea
                  rows={2}
                  value={milestoneNotes}
                  onChange={(e) => setMilestoneNotes(e.target.value)}
                  placeholder="e.g. Passed Debre Zeyit toll checkpoint, container temperature maintained at 4°C"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071510]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setMilestoneModalShipment(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Log Milestone Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
