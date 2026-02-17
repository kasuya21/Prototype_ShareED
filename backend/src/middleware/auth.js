import { validateSession } from '../services/authService.js';
import { ValidationError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Authentication middleware
 * Validates session token and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header or session
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Validate token and get user
    const user = await validateSession(token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (token) {
      const user = await validateSession(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware factory
 * Checks if user has required role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      next(error);
    }
  };
}

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has elevated permissions
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 */
export function requireOwnership(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const ownerId = await getResourceOwnerId(req);

      // Allow if user is owner, moderator, or admin
      if (req.user.id !== ownerId && !['moderator', 'admin'].includes(req.user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
        return res.status(error instanceof UnauthorizedError ? 401 : 403).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      next(error);
    }
  };
}
