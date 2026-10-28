'use client';

import { useState, useEffect, useCallback } from 'react';
import { superadminApi, AuditLogItem } from '@/lib/superadminApi';

// ─── Action badge colours ─────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE:         'bg-emerald-100 text-emerald-800',
  UPDATE:         'bg-blue-100   text-blue-800',
  DELETE:         'bg-red-100    text-red-800',
  STATUS_CHANGE:  'bg-amber-100  text-amber-800',
  ROLE_CHANGE:    'bg-purple-100 text-purple-800',
  PRICE_CHANGE:   'bg-orange-100 text-orange-800',
  ADMIN_OVERRIDE: 'bg-rose-100   text-rose-800',
  LOGIN:          'bg-sky-100    text-sky-800',
  LOGOUT:         'bg-slate-100  text-slate-700',
  SUSPENSION:     'bg-red-100    text-red-700',
  REINSTATE:      'bg-green-100  text-green-800',
  CONFIG_CHANGE:  'bg-indigo-100 text-indigo-800',
};

const ENTITY_TYPE_OPTIONS = [
  '', 'User', 'Market', 'City', 'IntercityRoute', 'PricingRule',
  'SystemSettings', 'DatabaseBackup', 'Order', 'DeliveryJob',
];

const ACTION_OPTIONS = [
  '', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ROLE_CHANGE',
  'PRICE_CHANGE', 'ADMIN_OVERRIDE', 'LOGIN', 'LOGOUT', 'SUSPENSION',
  'REINSTATE', 'CONFIG_CHANGE',
];

function formatTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function JsonDiff({ label, value }: { label: string; value: any }) {
  if (value == null) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ log, onClose }: { log: AuditLogItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Audit Log Detail</h2>
            <p className="text-sm text-gray-500 mt-0.5">ID: <span className="font-mono text-xs">{log.id}</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Action</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                {log.action}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Entity Type</p>
              <p className="font-medium text-gray-800">{log.entityType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Entity ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{log.entityId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Actor ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{log.actorId ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Timestamp</p>
              <p className="text-gray-800">{formatTs(log.occurredAt)}</p>
            </div>
            {log.reason && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reason</p>
                <p className="text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  {log.reason}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <JsonDiff label="Previous Value" value={log.previousValue} />
            <JsonDiff label="New Value" value={log.newValue} />
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#059669] text-white text-sm font-medium hover:bg-[#047857] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superadminApi.getAuditLogs({
        page,
        limit: 25,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        search: search || undefined,
      });
      setLogs(res?.logs ?? []);
      setPagination(res?.pagination ?? { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">
            Immutable record of all administrative actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-600">🔒</span>
          <span className="text-amber-700 font-medium">Logs are read-only and tamper-resistant</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by entity ID or reason…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); handleFilterChange(); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.filter(Boolean).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={entityTypeFilter}
            onChange={e => { setEntityTypeFilter(e.target.value); handleFilterChange(); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
          >
            <option value="">All Entity Types</option>
            {ENTITY_TYPE_OPTIONS.filter(Boolean).map(et => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setActionFilter('');
              setEntityTypeFilter('');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">
            {loading ? 'Loading…' : `${pagination.total.toLocaleString()} records`}
          </h2>
          <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="p-6 text-center text-red-600 text-sm">
            <span className="text-2xl block mb-2">⚠️</span>
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !error && (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {/* Table Body */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Entity Type</th>
                  <th className="px-4 py-3 text-left">Entity ID</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <div className="text-3xl mb-2">📋</div>
                      <p>No audit log entries found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                        {formatTs(log.occurredAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-gray-600 truncate max-w-[100px]">
                          {log.actorId ?? <span className="text-gray-400 italic">system</span>}
                        </div>
                        {(log as any).actor?.role && (
                          <div className="text-[10px] text-gray-400 mt-0.5">{(log as any).actor.role}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium text-xs">{log.entityType}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-gray-500 truncate block max-w-[120px]">
                          {log.entityId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px]">
                        <span className="line-clamp-2">{log.reason ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-[#059669] hover:text-[#047857] text-xs font-medium hover:underline whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-500">{page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
