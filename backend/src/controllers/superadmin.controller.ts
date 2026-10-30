import type { Request, Response, NextFunction } from 'express';
import { SuperadminService } from '../services/superadmin.service.js';
import { AdminService } from '../services/admin.service.js';

function paramId(req: Request): string {
  const raw = req.params.id;
  if (Array.isArray(raw)) return raw[0] || '';
  return raw || '';
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as string) || '30d';
    const data = await SuperadminService.getDashboardOverview(period);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Users & Roles ───────────────────────────────────────────────────────────

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, role, status, verificationStatus, page, limit } = req.query as any;
    const data = await SuperadminService.getUsers({
      search,
      role,
      status,
      verificationStatus,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function verifyFarmer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, note } = req.body;
    const actorId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Farmer ID and verification status are required.' } });
    }

    const updated = await AdminService.verifyFarmer(id, status, note || 'Superadmin verification review', actorId);
    return res.json({ success: true, data: updated, message: `Farmer verification updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function verifyWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, reason } = req.body;
    const actorId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Worker ID and verification status are required.' } });
    }

    const updated = await AdminService.verifyWorker(id, status, reason || 'Superadmin fleet compliance review', actorId);
    return res.json({ success: true, data: updated, message: `Worker status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function provisionAdministrator(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, phone, email, role, password } = req.body;
    const actorId = req.auth?.sub;

    if (!fullName || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name, phone, and administrative role are required.' },
      });
    }

    const created = await SuperadminService.provisionAdministrator(
      { fullName, phone, email, role, password },
      actorId
    );
    return res.status(201).json({
      success: true,
      data: created,
      message: `Administrator account for ${created.fullName} created successfully.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to provision administrator.' },
    });
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { role, reason } = req.body;
    const actorId = req.auth?.sub!;

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'User ID and target role are required.' },
      });
    }

    const updated = await SuperadminService.updateUserRole(id, role, reason, actorId);
    return res.json({
      success: true,
      data: updated,
      message: `User role updated to ${role}.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update user role.' },
    });
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { isActive, reason } = req.body;
    const actorId = req.auth?.sub!;

    if (!id || isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'User ID and isActive status are required.' },
      });
    }

    const updated = await SuperadminService.updateUserStatus(id, Boolean(isActive), reason, actorId);
    return res.json({
      success: true,
      data: updated,
      message: `Account status updated to ${isActive ? 'Active' : 'Suspended'}.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update user status.' },
    });
  }
}

export async function revokeUserSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { reason } = req.body;
    const actorId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'User ID is required.' },
      });
    }

    const result = await SuperadminService.revokeUserSessions(id, reason, actorId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to revoke user sessions.' },
    });
  }
}

// ─── Settings & Limits ───────────────────────────────────────────────────────

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = SuperadminService.getSettings();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { patch, reason } = req.body;
    const actorId = req.auth?.sub!;

    if (!patch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Settings configuration patch payload is required.' },
      });
    }

    const updated = await SuperadminService.updateSettings(patch, reason, actorId);
    return res.json({
      success: true,
      data: updated,
      message: 'System settings saved successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update system settings.' },
    });
  }
}

// ─── Regions & Markets ───────────────────────────────────────────────────────

export async function getMarketsAndCities(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await SuperadminService.getMarketsAndCities();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createCity(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, regionName, latitude, longitude } = req.body;
    const actorId = req.auth?.sub!;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'City name, latitude, and longitude are required.' },
      });
    }

    const city = await SuperadminService.createCity({ name, regionName, latitude, longitude }, actorId);
    return res.status(201).json({
      success: true,
      data: city,
      message: `City ${city.name} created.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to create city.' },
    });
  }
}

export async function createMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const { cityId, name, description, latitude, longitude, serviceRadiusKm } = req.body;
    const actorId = req.auth?.sub!;

    if (!cityId || !name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'City ID, market name, latitude, and longitude are required.' },
      });
    }

    const market = await SuperadminService.createMarket(
      { cityId, name, description, latitude, longitude, serviceRadiusKm },
      actorId
    );
    return res.status(201).json({
      success: true,
      data: market,
      message: `Market ${market.name} created.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to create market.' },
    });
  }
}

export async function updateMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { serviceRadiusKm, isActive, description } = req.body;
    const actorId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Market ID is required.' },
      });
    }

    const updated = await SuperadminService.updateMarket(id, { serviceRadiusKm, isActive, description }, actorId);
    return res.json({
      success: true,
      data: updated,
      message: 'Market configuration updated.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update market.' },
    });
  }
}

// ─── Intercity Routes ────────────────────────────────────────────────────────

export async function getIntercityRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await SuperadminService.getIntercityRoutes();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createIntercityRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      originCityId,
      destinationCityId,
      originMarketId,
      destinationMarketId,
      transitDays,
      requiresApproval,
      minLimit,
      maxLimit,
      notes,
    } = req.body;
    const actorId = req.auth?.sub!;

    const route = await SuperadminService.createIntercityRoute(
      {
        originCityId,
        destinationCityId,
        originMarketId,
        destinationMarketId,
        transitDays,
        requiresApproval,
        minLimit,
        maxLimit,
        notes,
      },
      actorId
    );
    return res.status(201).json({
      success: true,
      data: route,
      message: 'Intercity route established successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to create route.' },
    });
  }
}

export async function updateIntercityRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, requiresApproval, minLimit, maxLimit, notes, estimatedTransitDays } = req.body;
    const actorId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Route ID is required.' },
      });
    }

    const updated = await SuperadminService.updateIntercityRoute(
      id,
      { status, requiresApproval, minLimit, maxLimit, notes, estimatedTransitDays },
      actorId
    );
    return res.json({
      success: true,
      data: updated,
      message: 'Intercity route policy updated.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update route.' },
    });
  }
}

// ─── Commissions & Fees ──────────────────────────────────────────────────────

export async function getPricingRules(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await SuperadminService.getPricingRules();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createPricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, type, scope, value, categoryId, marketId, intercityRouteId } = req.body;
    const actorId = req.auth?.sub!;

    if (!name || value === undefined || !type) {
      return res.status(400).json({
        success: false,
        error: { message: 'Rule name, type, and value are required.' },
      });
    }

    const rule = await SuperadminService.createPricingRule(
      { name, description, type, scope, value, categoryId, marketId, intercityRouteId },
      actorId
    );
    return res.status(201).json({
      success: true,
      data: rule,
      message: `Pricing fee rule ${rule.name} configured.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to create fee rule.' },
    });
  }
}

export async function updatePricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { value, isActive, description, name } = req.body;
    const actorId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Pricing rule ID is required.' },
      });
    }

    const updated = await SuperadminService.updatePricingRule(
      id,
      { value, isActive, description, name },
      actorId
    );
    return res.json({
      success: true,
      data: updated,
      message: 'Fee policy rule updated.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err?.message || 'Failed to update fee rule.' },
    });
  }
}

// ─── Reports & Analytics ─────────────────────────────────────────────────────

export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as string) || '30d';
    const data = await SuperadminService.getReports(period);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, action, entityType, search } = req.query as any;
    const data = await SuperadminService.getAuditLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      action,
      entityType,
      search,
    });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Security Oversight ──────────────────────────────────────────────────────

export async function getSecurityOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await SuperadminService.getSecurityOverview();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Database & Backup ───────────────────────────────────────────────────────

export async function getDatabaseHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await SuperadminService.getDatabaseHealth();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function triggerBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = req.auth?.sub!;
    const result = await SuperadminService.triggerBackupSnapshot(actorId);
    return res.json({
      success: true,
      data: result,
      message: 'Database backup snapshot generated and recorded.',
    });
  } catch (err) {
    next(err);
  }
}

