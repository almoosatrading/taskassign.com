import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db/database';
import { User, UserRole, AccountStatus } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'almoosa-hr-super-secure-production-jwt-token-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const userWithHash = db.findUserById(decoded.id);

    if (!userWithHash) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found or has been removed',
      });
    }

    const { passwordHash, ...safeUser } = userWithHash;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication session',
    });
  }
}

export function requireActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.status !== 'ACTIVE') {
    return res.status(403).json({
      error: 'AccountNotActive',
      status: req.user.status,
      message: `Account is currently in ${req.user.status} state. Access to task operations is restricted.`,
    });
  }

  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record security audit log for unauthorized privilege escalation attempt
      db.addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'PRIVILEGE_VIOLATION',
        actionAr: 'محاولة وصول غير مصرح لصلاحية',
        details: `User with role ${req.user.role} attempted to access route restricted to [${allowedRoles.join(', ')}] at ${req.originalUrl}`,
        detailsAr: `حاول المستخدم ذو الصلاحية ${req.user.role} الوصول لمسار مخصص لصلاحيات [${allowedRoles.join(', ')}]`,
        category: 'SECURITY',
        status: 'DENIED',
        ipAddress: req.ip || '127.0.0.1',
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have the required role to perform this operation',
      });
    }

    next();
  };
}

export function logAudit(
  req: AuthenticatedRequest,
  action: string,
  actionAr: string,
  details: string,
  detailsAr: string,
  category: 'AUTH' | 'TASK' | 'DIRECTORY' | 'APPROVAL' | 'SECURITY',
  status: 'SUCCESS' | 'DENIED' = 'SUCCESS',
  targetRecordId?: string | null
) {
  const actor = req.user || {
    id: 'ANONYMOUS',
    name: 'Unauthenticated Request',
    role: 'EMPLOYEE' as UserRole,
  };

  db.addAuditLog({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    actionAr,
    details,
    detailsAr,
    targetRecordId,
    category,
    status,
    ipAddress: req.ip || '127.0.0.1',
  });
}
