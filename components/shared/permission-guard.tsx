'use client';

import { useAuth } from '@/features/auth/components/auth-provider';
import type { Permission, UserRole } from '@/features/auth/types';
import type { ReactNode } from 'react';

interface PermissionGuardProps {
  permission?: Permission;
  role?: UserRole | UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasRole } = useAuth();

  const hasAccess =
    (permission ? hasPermission(permission) : true) &&
    (role ? hasRole(role) : true);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}
