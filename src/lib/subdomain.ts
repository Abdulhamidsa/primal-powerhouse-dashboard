/**
 * Subdomain configuration and utilities
 * Handles routing based on subdomains for admin/user separation
 */

export type Subdomain = 'admin' | 'user' | 'unknown';

export const SUBDOMAINS = {
  ADMIN: 'admin',
  USER: 'app',
} as const;

export const DOMAIN_CONFIG = {
  development: {
    admin: 'admin.localhost:3000',
    user: 'app.localhost:3000',
    main: 'localhost:3000',
  },
  production: {
    admin: 'admin.primalpowerhouse.com',
    user: 'app.primalpowerhouse.com',
    main: 'primalpowerhouse.com',
  },
} as const;

/**
 * Extract subdomain from hostname
 * @param hostname - The hostname from request headers
 * @returns The subdomain type: 'admin', 'user', or 'unknown'
 */
export function getSubdomainFromHostname(hostname: string): Subdomain {
  if (!hostname) return 'unknown';

  // Admin subdomains
  if (hostname.includes('admin.')) {
    return 'admin';
  }

  // User subdomains
  if (hostname.includes('app.')) {
    return 'user';
  }

  // Check for localhost development
  if (hostname.includes('localhost')) {
    // If no subdomain specified on localhost, default to user
    if (!hostname.includes('admin.localhost')) {
      return 'user';
    }
  }

  return 'unknown';
}

/**
 * Get the appropriate root path based on subdomain
 */
export function getRootPathBySubdomain(subdomain: Subdomain): string {
  switch (subdomain) {
    case 'admin':
      return '/admin/dashboard';
    case 'user':
      return '/user/dashboard';
    default:
      return '/';
  }
}

/**
 * Get login path by subdomain
 */
export function getLoginPathBySubdomain(subdomain: Subdomain): string {
  switch (subdomain) {
    case 'admin':
      return '/admin/login';
    case 'user':
      return '/user/login';
    default:
      return '/user/login'; // default to user
  }
}

/**
 * Check if a path belongs to a specific subdomain
 */
export function isPathForSubdomain(path: string, subdomain: Subdomain): boolean {
  if (subdomain === 'admin') {
    return path.startsWith('/admin');
  }
  if (subdomain === 'user') {
    return path.startsWith('/user');
  }
  return false;
}

/**
 * Get the opposite path (e.g., /user/dashboard -> /admin/dashboard)
 */
export function getOppositeSubdomainPath(path: string, currentSubdomain: Subdomain): string {
  if (currentSubdomain === 'admin') {
    return path.replace(/^\/admin/, '/user');
  }
  if (currentSubdomain === 'user') {
    return path.replace(/^\/user/, '/admin');
  }
  return path;
}
