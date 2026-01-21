/**
 * Subdomain configuration and utilities
 * Handles routing based on subdomains for admin/app separation
 */

export type Subdomain = 'admin' | 'app' | 'main' | 'unknown';

export const SUBDOMAINS = {
  ADMIN: 'admin',
  APP: 'app',
} as const;

export const DOMAIN_CONFIG = {
  development: {
    admin: 'admin.localhost:3000',
    app: 'app.localhost:3000',
    main: 'localhost:3000',
  },
  production: {
    admin: 'admin.primalpowerhouse.com',
    app: 'app.primalpowerhouse.com',
    main: 'primalpowerhouse.com',
  },
} as const;

export function getSubdomainFromHostname(hostname: string): Subdomain {
  if (!hostname) return 'unknown';

  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  if (hostWithoutPort === 'admin.primalpowerhouse.com' || hostWithoutPort.startsWith('admin.')) {
    return 'admin';
  }

  if (hostWithoutPort === 'app.primalpowerhouse.com' || hostWithoutPort.startsWith('app.')) {
    return 'app';
  }

  if (hostWithoutPort === 'primalpowerhouse.com' || hostWithoutPort === 'www.primalpowerhouse.com') {
    return 'main';
  }

  if (hostWithoutPort.includes('localhost')) {
    if (hostWithoutPort.includes('admin.localhost')) return 'admin';
    if (hostWithoutPort.includes('app.localhost')) return 'app';
    return 'app';
  }

  return 'unknown';
}

export function getRootPathBySubdomain(subdomain: Subdomain): string {
  switch (subdomain) {
    case 'admin':
      return '/admin/dashboard';
    case 'app':
      return '/user/dashboard';
    default:
      return '/';
  }
}

export function getLoginPathBySubdomain(_subdomain: Subdomain): string {
  return '/login';
}

export function isPathForSubdomain(path: string, subdomain: Subdomain): boolean {
  if (subdomain === 'admin') return path.startsWith('/admin');
  if (subdomain === 'app') return path.startsWith('/user');
  return true;
}

export function getOppositeSubdomainPath(path: string, currentSubdomain: Subdomain): string {
  if (currentSubdomain === 'admin') return path.replace(/^\/admin/, '/user');
  if (currentSubdomain === 'app') return path.replace(/^\/user/, '/admin');
  return path;
}
