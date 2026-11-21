'use client';

import { getAccessToken } from './auth';
import { API_BASE_URL } from './apiConfig';

export interface QueuedAction {
  id: string;
  type: 'STATUS_UPDATE' | 'INCIDENT_REPORT' | 'BATCH_ACCEPT';
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT';
  payload: any;
  label: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEY = 'agrimarket_courier_offline_queue_v1';

/** Retrieve currently queued actions from persistent storage */
export function getOfflineQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[OfflineQueue] Failed to read offline queue from storage:', err);
    return [];
  }
}

/** Save actions to persistent storage and notify listeners */
function saveQueue(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyQueueChanged(queue);
  } catch (err) {
    console.error('[OfflineQueue] Failed to save queue to storage:', err);
  }
}

/** Notify UI components about queue length changes */
function notifyQueueChanged(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('agrimarket:offline-queue-changed', {
      detail: {
        pendingCount: queue.length,
        items: queue,
      },
    })
  );
}

/** Enqueue an action when network is unavailable */
export function enqueueOfflineAction(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>): QueuedAction {
  const newAction: QueuedAction = {
    ...action,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  const queue = getOfflineQueue();
  queue.push(newAction);
  saveQueue(queue);

  console.log(`[OfflineQueue] Enqueued action: ${newAction.label} (${newAction.id})`);
  return newAction;
}

/** Remove an action from the queue by ID */
export function removeQueuedAction(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveQueue(queue);
}

/** Process and flush all pending offline actions to the backend */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined') return { synced: 0, failed: 0 };
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const token = getAccessToken();
  if (!token) {
    console.warn('[OfflineQueue] Cannot flush queue: No auth token available.');
    return { synced: 0, failed: queue.length };
  }

  let synced = 0;
  let failed = 0;
  const remainingQueue: QueuedAction[] = [];

  for (const item of queue) {
    try {
      const url = `${API_BASE_URL}${item.endpoint}`;
      const res = await fetch(url, {
        method: item.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        synced++;
        console.log(`[OfflineQueue] Successfully synced queued action: ${item.label}`);
      } else {
        const errorText = await res.text().catch(() => 'Server error');
        failed++;
        remainingQueue.push({
          ...item,
          retryCount: item.retryCount + 1,
          lastError: `HTTP ${res.status}: ${errorText}`,
        });
      }
    } catch (netErr: any) {
      failed++;
      remainingQueue.push({
        ...item,
        retryCount: item.retryCount + 1,
        lastError: netErr?.message || 'Network connection failed during sync',
      });
      // Break early if completely offline so we don't spam failed fetches
      break;
    }
  }

  saveQueue(remainingQueue);
  return { synced, failed };
}

// Automatically register online event listener in the browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Online event detected. Auto-flushing pending actions...');
    flushOfflineQueue().catch((err) => console.warn('[OfflineQueue] Auto-flush error:', err));
  });
}
