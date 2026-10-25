import type { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';

function paramId(req: Request): string {
  const raw = req.params.id;
  if (Array.isArray(raw)) return raw[0] || '';
  return raw || '';
}

export async function getDashboardOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const period = req.query.period as any;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const data = await AdminService.getDashboardOverview({ period, startDate, endDate });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId, status, search, stock } = req.query as any;
    const products = await AdminService.getProducts({ categoryId, status, search, stock });
    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

export async function updateProductStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, reason } = req.body;
    const adminId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Product ID and status are required.' } });
    }

    const updated = await AdminService.updateProductStatus(id, status, reason || 'Administrative review', adminId);
    return res.json({ success: true, data: updated, message: 'Product listing status updated.' });
  } catch (err) {
    next(err);
  }
}

export async function getFarmers(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search } = req.query as any;
    const farmers = await AdminService.getFarmers({ status, search });
    return res.json({ success: true, data: farmers });
  } catch (err) {
    next(err);
  }
}

export async function verifyFarmer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, note } = req.body;
    const adminId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Farmer ID and verification status are required.' } });
    }

    const updated = await AdminService.verifyFarmer(id, status, note || 'Administrative verification review', adminId);
    return res.json({ success: true, data: updated, message: `Farmer verification updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getBuyers(req: Request, res: Response, next: NextFunction) {
  try {
    const { search } = req.query as any;
    const buyers = await AdminService.getBuyers({ search });
    return res.json({ success: true, data: buyers });
  } catch (err) {
    next(err);
  }
}

export async function updateBuyerStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { isActive, reason } = req.body;
    const adminId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'Buyer ID is required.' } });
    }

    const updated = await AdminService.updateBuyerStatus(id, Boolean(isActive), reason || 'Admin account update', adminId);
    return res.json({ success: true, data: updated, message: 'Buyer account status updated.' });
  } catch (err) {
    next(err);
  }
}

export async function getWorkers(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, availability, search } = req.query as any;
    const workers = await AdminService.getWorkers({ status, availability, search });
    return res.json({ success: true, data: workers });
  } catch (err) {
    next(err);
  }
}

export async function verifyWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, reason } = req.body;
    const adminId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Worker ID and verification status are required.' } });
    }

    const updated = await AdminService.verifyWorker(id, status, reason || 'Fleet compliance review', adminId);
    return res.json({ success: true, data: updated, message: `Worker status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { tradeType, status, search } = req.query as any;
    const orders = await AdminService.getOrders({ tradeType, status, search });
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'Order ID is required.' } });
    }
    const order = await AdminService.getOrderById(id);
    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { status, reason } = req.body;
    const adminId = req.auth?.sub!;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: { message: 'Order ID and status are required.' } });
    }

    const updated = await AdminService.updateOrderStatus(id, status, reason || 'Administrative order management', adminId);
    return res.json({ success: true, data: updated, message: `Order status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getIntercityRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const routes = await AdminService.getIntercityRoutes();
    return res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
}

export async function getIntercityApprovals(req: Request, res: Response, next: NextFunction) {
  try {
    const approvals = await AdminService.getIntercityApprovals();
    return res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
}

export async function decideIntercityApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { decision, notes } = req.body;
    const adminId = req.auth?.sub!;

    if (!id || !decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
      return res.status(400).json({ success: false, error: { message: 'Approval ID and valid decision (APPROVED | REJECTED) are required.' } });
    }

    const result = await AdminService.decideIntercityApproval(id, decision, notes || 'Admin approval decision', adminId);
    return res.json({ success: true, data: result, message: `Order intercity trade ${decision.toLowerCase()}.` });
  } catch (err) {
    next(err);
  }
}

export async function getMarketsAndCities(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getMarketsAndCities();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getTransactions();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const period = req.query.period as any;
    const data = await AdminService.getReports(period);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.getSettings();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePricingRule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const { value, isActive } = req.body;
    const adminId = req.auth?.sub!;

    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'Pricing rule ID is required.' } });
    }

    const updated = await AdminService.updatePricingRule(id, Number(value), Boolean(isActive), adminId);
    return res.json({ success: true, data: updated, message: 'Pricing policy rule updated.' });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, entityType } = req.query as any;
    const logs = await AdminService.getAuditLogs({ limit: Number(limit) || 50, entityType });
    return res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}
