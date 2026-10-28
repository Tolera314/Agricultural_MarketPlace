'use client';

import { useState, useEffect } from 'react';
import { superadminApi, DatabaseHealthData } from '@/lib/superadminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMs(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

function HealthBadge({ status }: { status: string }) {
  const isHealthy = status === 'HEALTHY';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold
      ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
      <span className={`w-2 h-2 rounded-full animate-pulse ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {status}
    </span>
  );
}

const TABLE_ICONS: Record<string, string> = {
  users: '👥',
  orders: '📦',
  productListings: '🌾',
  deliveryJobs: '🚚',
  markets: '🏪',
  pricingRules: '💰',
  auditLogs: '📋',
};

const TABLE_LABELS: Record<string, string> = {
  users: 'Users',
  orders: 'Orders',
  productListings: 'Product Listings',
  deliveryJobs: 'Delivery Jobs',
  markets: 'Markets',
  pricingRules: 'Pricing Rules',
  auditLogs: 'Audit Logs',
};

function BackupStatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE' || status === 'ENABLED') {
    return <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ {status}</span>;
  }
  return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">⚠ {status}</span>;
}

// ─── Backup Snapshot Confirmation Modal ───────────────────────────────────────
function BackupConfirmModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">💾</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Trigger Backup Snapshot</h2>
              <p className="text-sm text-gray-500">This action will be audited and recorded.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-amber-900 font-medium mb-1">⚠️ Before you proceed</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>A snapshot record will be written to the Audit Logs.</li>
              <li>Live record counts are captured at this moment in time.</li>
              <li>This does <strong>not</strong> create a restorable database dump — it requires external Neon backup infrastructure.</li>
              <li>For actual data restoration, use the Neon console or your provider's backup system.</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-[#059669] text-white rounded-lg text-sm font-semibold hover:bg-[#047857] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Running…' : '💾 Confirm Snapshot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BackupDatabasePage() {
  const [health, setHealth] = useState<DatabaseHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<{
    snapshotId: string; status: string; timestamp: string; recordsCaptured: number;
  } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [latencyColor, setLatencyColor] = useState('#059669');

  useEffect(() => {
    superadminApi.getDatabaseHealth()
      .then(res => {
        const d = res;
        setHealth(d ?? null);
        if (d) {
          if (d.connectionLatencyMs > 500) setLatencyColor('#dc2626');
          else if (d.connectionLatencyMs > 200) setLatencyColor('#d97706');
          else setLatencyColor('#059669');
        }
      })
      .catch(e => setError(e?.message ?? 'Failed to load database health'))
      .finally(() => setLoading(false));
  }, []);

  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    setBackupError(null);
    setBackupResult(null);
    try {
      const res = await superadminApi.triggerBackup();
      setBackupResult(res ?? null);
      setShowConfirm(false);
      // Refresh health to get updated record counts
      const refreshed = await superadminApi.getDatabaseHealth();
      setHealth(refreshed ?? null);
    } catch (e: any) {
      setBackupError(e?.message ?? 'Backup snapshot failed');
      setShowConfirm(false);
    } finally {
      setBackupLoading(false);
    }
  };

  const tables = health?.tables
    ? Object.entries(health.tables).filter(([, v]) => typeof v === 'number')
    : [];

  const totalRecords = tables.reduce((sum, [, v]) => sum + (v as number), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup &amp; Database</h1>
          <p className="text-gray-500 text-sm mt-1">
            Live database health, record metrics, and backup management
          </p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading || !!error}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#059669] text-white text-sm font-semibold hover:bg-[#047857] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          💾 Trigger Backup Snapshot
        </button>
      </div>

      {/* Backup Result Banner */}
      {backupResult && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Snapshot Recorded Successfully</p>
            <div className="flex flex-wrap gap-4 mt-1 text-xs text-emerald-700">
              <span>ID: <span className="font-mono">{backupResult.snapshotId}</span></span>
              <span>Status: <span className="font-semibold">{backupResult.status}</span></span>
              <span>Records captured: <span className="font-semibold">{formatNumber(backupResult.recordsCaptured)}</span></span>
              <span>At: {new Date(backupResult.timestamp).toLocaleString('en-GB')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Backup Error Banner */}
      {backupError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          ⚠️ {backupError}
        </div>
      )}

      {/* Load Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-36 bg-gray-100 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Database Connection Health Card */}
      {health && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0A3323]/10 flex items-center justify-center text-2xl">🗄️</div>
              <div>
                <h2 className="font-bold text-gray-900">Database Connection</h2>
                <p className="text-sm text-gray-500">{health.provider}</p>
              </div>
            </div>
            <HealthBadge status={health.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Latency */}
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Connection Latency</p>
              <p className="text-2xl font-bold" style={{ color: latencyColor }}>
                {formatMs(health.connectionLatencyMs)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {health.connectionLatencyMs < 100 ? 'Excellent' : health.connectionLatencyMs < 300 ? 'Good' : 'High — check network'}
              </p>
            </div>

            {/* Backup Schedule */}
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Backup Schedule</p>
              <p className="text-lg font-bold text-gray-900">{health.backups?.automatedFrequency ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Retention: {health.backups?.retentionDays ?? '—'} days</p>
            </div>

            {/* Last Backup */}
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Last Backup</p>
              <div className="flex items-center gap-2 mt-1">
                <BackupStatusBadge status={health.backups?.backupStatus ?? 'UNKNOWN'} />
              </div>
              <p className="text-xs text-gray-600 mt-2 font-mono">
                {health.backups?.lastBackupAt
                  ? new Date(health.backups.lastBackupAt).toLocaleString('en-GB')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Neon Notice */}
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
            <span className="text-blue-400 text-lg flex-shrink-0">ℹ️</span>
            <div className="text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold">Managed by Neon PostgreSQL.</span>{' '}
              Neon provides automated point-in-time recovery (PITR), daily backups, and branch snapshots.
              For data restoration, use the{' '}
              <strong>Neon Console</strong> or contact your database administrator.
              Connection strings and credentials are never displayed here.
            </div>
          </div>
        </div>
      )}

      {/* Live Record Counts */}
      {health && !loading && tables.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Live Record Counts</h2>
            <span className="text-xs text-gray-500">
              Total: <span className="font-bold text-gray-800">{formatNumber(totalRecords)}</span> records
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
            {tables.map(([key, value]) => (
              <div key={key} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{TABLE_ICONS[key] ?? '📊'}</span>
                  <span className="text-xs text-gray-500 font-medium">{TABLE_LABELS[key] ?? key}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(value as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup History Notice */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Backup Infrastructure Notes</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p className="font-semibold text-gray-900">What "Trigger Backup Snapshot" does:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600">
              <li>Captures live record counts from all primary tables at the current timestamp.</li>
              <li>Records the event to the immutable <strong>AuditLog</strong> with the acting Superadmin's ID.</li>
              <li>Returns a <code className="bg-white border border-gray-200 rounded px-1">snapshotId</code> and summary for reference.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-1">
            <p className="font-semibold text-amber-900">⚠️ Limitations — read before acting</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-800">
              <li>This does <strong>not</strong> create a binary database dump or point-in-time restore point.</li>
              <li>Database restoration requires Neon's native PITR capabilities or provider-managed backups.</li>
              <li>Do not rely on snapshot records for disaster recovery without a tested restore procedure.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-1">🔗 Full backup capabilities available via:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-blue-800">
              <li>Neon Console → Branches & Restore (point-in-time recovery)</li>
              <li>Neon API for automated branch snapshots</li>
              <li>pg_dump / pg_restore for manual exports (requires DB credentials — handled externally)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <BackupConfirmModal
          onConfirm={handleTriggerBackup}
          onClose={() => setShowConfirm(false)}
          loading={backupLoading}
        />
      )}
    </div>
  );
}
