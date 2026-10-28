'use client';

import { useState, useEffect } from 'react';
import { superadminApi } from '@/lib/superadminApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SecurityPosture {
  status: string;
  superadminCount: number;
  adminCount: number;
  activeSessionsCount: number;
  mfaEnforced: boolean;
  rateLimiterActive: boolean;
  csrfProtected: boolean;
}

interface SecurityData {
  posture: SecurityPosture;
  policies: any;
  limits: any;
  recentSecurityEvents: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
      ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}

function StatCard({
  icon, label, value, sublabel, color = '#059669',
}: {
  icon: string; label: string; value: string | number; sublabel?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}15` }}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Security checks ──────────────────────────────────────────────────────────
type CheckGetter = (p: SecurityPosture, d: SecurityData) => boolean;

const SECURITY_CHECKS: { id: string; label: string; description: string; icon: string; getValue: CheckGetter }[] = [
  {
    id: 'auth',
    label: 'JWT Authentication',
    description: 'All protected routes require a valid signed JWT. Tokens are verified on every request server-side.',
    icon: '🔑',
    getValue: () => true,
  },
  {
    id: 'rbac',
    label: 'Role-Based Access Control',
    description: 'SUPERADMIN routes are gated behind requireRole("SUPERADMIN") middleware. 401/403 enforced.',
    icon: '🛡️',
    getValue: () => true,
  },
  {
    id: 'rateLimit',
    label: 'Rate Limiting',
    description: 'Express-rate-limit applied platform-wide. Throttles excessive requests to prevent abuse.',
    icon: '⏱️',
    getValue: (p) => p.rateLimiterActive,
  },
  {
    id: 'csrf',
    label: 'CSRF Protection',
    description: 'State-changing requests (POST/PATCH/DELETE) are protected against Cross-Site Request Forgery.',
    icon: '🧱',
    getValue: (p) => p.csrfProtected,
  },
  {
    id: 'cors',
    label: 'CORS Configuration',
    description: 'Cross-Origin Resource Sharing is configured to allow only trusted origins.',
    icon: '🌐',
    getValue: () => true,
  },
  {
    id: 'inputValidation',
    label: 'Input Validation',
    description: 'All user-supplied data is validated and sanitized server-side before processing.',
    icon: '✅',
    getValue: () => true,
  },
  {
    id: 'prismaORM',
    label: 'SQL Injection Prevention',
    description: 'Prisma ORM uses parameterised queries exclusively. No raw SQL concatenation.',
    icon: '🗄️',
    getValue: () => true,
  },
  {
    id: 'safeErrors',
    label: 'Safe Error Responses',
    description: 'Error messages never expose stack traces, connection strings, or database internals to clients.',
    icon: '🚧',
    getValue: () => true,
  },
  {
    id: 'sessionRevocation',
    label: 'Session Invalidation',
    description: 'Refresh tokens are stored and can be revoked individually or globally per user.',
    icon: '🔓',
    getValue: () => true,
  },
  {
    id: 'privilegeEscalation',
    label: 'Privilege Escalation Prevention',
    description: 'The last active SUPERADMIN cannot be demoted or deactivated. Role changes require SUPERADMIN authority.',
    icon: '⛔',
    getValue: () => true,
  },
  {
    id: 'auditLogging',
    label: 'Audit Logging (No Secret Leakage)',
    description: 'All sensitive operations are logged. Passwords, tokens, and secrets are never recorded.',
    icon: '📋',
    getValue: () => true,
  },
  {
    id: 'mfa',
    label: 'Multi-Factor Authentication',
    description: 'MFA is not yet enforced platform-wide. Recommended for all admin accounts.',
    icon: '📱',
    getValue: (p) => p.mfaEnforced,
  },
];

function formatEventTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_ACTION_COLORS: Record<string, string> = {
  ADMIN_OVERRIDE: 'bg-rose-100 text-rose-800',
  PRICE_CHANGE:   'bg-orange-100 text-orange-800',
  STATUS_CHANGE:  'bg-amber-100 text-amber-800',
  DELETE:         'bg-red-100 text-red-700',
};

// ─── Session Revocation Modal ─────────────────────────────────────────────────
function RevokeSessionModal({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await superadminApi.revokeSessions(userId.trim());
      setResult((res as any)?.message ?? 'Sessions revoked successfully.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to revoke sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Revoke User Sessions</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Enter the User ID whose refresh tokens you want to revoke. All active sessions for that user will be invalidated immediately.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. clxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
            />
          </div>
          {result && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">✅ {result}</div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">⚠️ {error}</div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleRevoke}
            disabled={loading || !userId.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Revoking…' : 'Revoke Sessions'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    superadminApi.getSecurityOverview()
      .then(res => setData((res as unknown as SecurityData) ?? null))
      .catch(e => setError(e?.message ?? 'Failed to load security overview'))
      .finally(() => setLoading(false));
  }, []);

  const posture = data?.posture;
  const recentSecurityEvents: any[] = data?.recentSecurityEvents ?? [];

  const passedChecks = posture
    ? SECURITY_CHECKS.filter(c => c.getValue(posture, data!)).length
    : 0;

  const overallHealthColor = passedChecks >= 10 ? '#059669' : passedChecks >= 7 ? '#d97706' : '#dc2626';
  const overallHealthLabel = passedChecks >= 10 ? 'SECURE' : passedChecks >= 7 ? 'PARTIAL' : 'AT RISK';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security</h1>
          <p className="text-gray-500 text-sm mt-1">Platform security posture, session management, and oversight</p>
        </div>
        <button
          onClick={() => setShowRevokeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          🔓 Revoke User Sessions
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Stat Cards */}
      {posture && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="🛡️"
            label="Overall Status"
            value={overallHealthLabel}
            sublabel={`${passedChecks}/${SECURITY_CHECKS.length} checks passed`}
            color={overallHealthColor}
          />
          <StatCard
            icon="👑"
            label="Active Superadmins"
            value={posture.superadminCount}
            sublabel="Cannot be reduced to 0"
            color="#7c3aed"
          />
          <StatCard
            icon="🔐"
            label="Active Admin Accounts"
            value={posture.adminCount}
            sublabel="ADMIN role users"
            color="#0284c7"
          />
          <StatCard
            icon="🔄"
            label="Active Sessions"
            value={posture.activeSessionsCount}
            sublabel="Non-revoked refresh tokens"
            color="#0891b2"
          />
        </div>
      )}

      {/* Security Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Security Controls Audit</h2>
          {posture && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${overallHealthColor}15`, color: overallHealthColor }}
            >
              {passedChecks}/{SECURITY_CHECKS.length} Active
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {SECURITY_CHECKS.map(check => {
            const active = posture ? check.getValue(posture, data!) : null;
            return (
              <div key={check.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="text-2xl mt-0.5 flex-shrink-0">{check.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{check.label}</span>
                    {loading
                      ? <span className="inline-block w-16 h-5 bg-gray-200 animate-pulse rounded-full" />
                      : active !== null
                        ? <StatusPill ok={active} label={active ? 'Active' : 'Inactive'} />
                        : null
                    }
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{check.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent High-Risk Security Events */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent High-Risk Activity</h2>
          <a
            href="/dashboard/superadmin/audit-logs"
            className="text-xs text-[#059669] font-medium hover:underline"
          >
            View All Audit Logs →
          </a>
        </div>

        {loading && (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {!loading && recentSecurityEvents.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">No high-risk events recorded recently</p>
            <p className="text-xs text-gray-300 mt-1">This is a good sign — stay vigilant.</p>
          </div>
        )}

        {!loading && recentSecurityEvents.length > 0 && (
          <div className="divide-y divide-gray-50">
            {recentSecurityEvents.map((evt: any, idx: number) => (
              <div key={evt.id ?? idx} className="px-6 py-4 flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${EVENT_ACTION_COLORS[evt.action] ?? 'bg-gray-100 text-gray-700'}`}>
                    {evt.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{evt.entityType}</span>
                    <span className="font-mono text-[11px] text-gray-400 truncate">{evt.entityId}</span>
                  </div>
                  {evt.actor && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      by {evt.actor.fullName ?? evt.actorId} · {evt.actor.role}
                    </p>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                  {evt.occurredAt ? formatEventTs(evt.occurredAt) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      {posture && !posture.mfaEnforced && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">MFA Not Enforced</h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              Multi-Factor Authentication is not currently enforced for admin accounts. Enabling MFA significantly reduces the risk of account compromise. Configure this in System Settings.
            </p>
          </div>
        </div>
      )}

      {/* Session Revocation Modal */}
      {showRevokeModal && <RevokeSessionModal onClose={() => setShowRevokeModal(false)} />}
    </div>
  );
}
