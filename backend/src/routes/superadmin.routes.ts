import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import {
  getDashboardOverview,
  getUsers,
  verifyFarmer,
  verifyWorker,
  provisionAdministrator,
  updateUserRole,
  updateUserStatus,
  revokeUserSessions,
  getSettings,
  updateSettings,
  getMarketsAndCities,
  createCity,
  createMarket,
  updateMarket,
  getIntercityRoutes,
  createIntercityRoute,
  updateIntercityRoute,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  getReports,
  getAuditLogs,
  getSecurityOverview,
  getDatabaseHealth,
  triggerBackup,
} from '../controllers/superadmin.controller.js';

const router = Router();

// ─── STRICT SUPERADMIN AUTHORIZATION ─────────────────────────────────────────
// Requires valid authentication AND strictly the SUPERADMIN role.
// Any non-superadmin (including ordinary ADMIN) will receive 403 Forbidden.
router.use(requireAuth, requireRole('SUPERADMIN'));

// 1. Dashboard Overview
router.get('/dashboard', getDashboardOverview);

// 2. Users & Roles Governance
router.get('/users', getUsers);
router.patch('/farmers/:id/verify', verifyFarmer);
router.patch('/workers/:id/verify', verifyWorker);
router.post('/users/provision', provisionAdministrator);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/revoke-sessions', revokeUserSessions);

// 3. System Settings & Transaction Limits
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// 4. Geographic Regions & Markets
router.get('/markets', getMarketsAndCities);
router.post('/cities', createCity);
router.post('/markets', createMarket);
router.patch('/markets/:id', updateMarket);

// 5. Intercity Trading Routes
router.get('/routes', getIntercityRoutes);
router.post('/routes', createIntercityRoute);
router.patch('/routes/:id', updateIntercityRoute);

// 6. Commissions & Fees (Pricing Rules)
router.get('/commissions', getPricingRules);
router.post('/commissions', createPricingRule);
router.patch('/commissions/:id', updatePricingRule);

// 7. Platform Reports & Analytics
router.get('/reports', getReports);

// 8. Audit Logs
router.get('/audit-logs', getAuditLogs);

// 9. Security Oversight
router.get('/security', getSecurityOverview);

// 10. Database Health & Backups
router.get('/backup/health', getDatabaseHealth);
router.post('/backup/snapshot', triggerBackup);

export default router;

