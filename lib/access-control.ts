/**
 * Simplified Access Control for BehindTheProtocol
 * Basic role-based access without extreme CEO blindfolding
 */

export type UserRole = 'operator' | 'admin' | 'ceo';

export interface AccessPermission {
  canViewAggregatedData: boolean;
  canViewIndividualReports: boolean;
  canModerateContent: boolean;
  canManageUsers: boolean;
  canViewSystemMetrics: boolean;
}

/**
 * Simplified role-based access control
 * CEO can see aggregated data but NOT individual user identities
 */
export class AccessControl {
  private static permissions: Record<UserRole, AccessPermission> = {
    operator: {
      canViewAggregatedData: true,
      canViewIndividualReports: false,
      canModerateContent: false,
      canManageUsers: false,
      canViewSystemMetrics: false
    },
    admin: {
      canViewAggregatedData: true,
      canViewIndividualReports: false,
      canModerateContent: true,
      canManageUsers: false,
      canViewSystemMetrics: true
    },
    ceo: {
      canViewAggregatedData: true,
      canViewIndividualReports: false, // CEO cannot see individual user identities
      canModerateContent: true,
      canManageUsers: true,
      canViewSystemMetrics: true
    }
  };

  /**
   * Get permissions for a user role
   */
  static getPermissions(role: UserRole): AccessPermission {
    return this.permissions[role];
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(role: UserRole, permission: keyof AccessPermission): boolean {
    return this.permissions[role][permission];
  }

  /**
   * Check if user can view aggregated data
   * All authenticated users can see aggregated data
   */
  static canViewAggregatedData(role: UserRole): boolean {
    return this.permissions[role].canViewAggregatedData;
  }

  /**
   * Check if user can view individual reports
   * NO ONE can view individual reports - this is the core privacy protection
   */
  static canViewIndividualReports(role: UserRole): boolean {
    return false; // Always false - no individual access
  }

  /**
   * Check if user can moderate content
   */
  static canModerateContent(role: UserRole): boolean {
    return this.permissions[role].canModerateContent;
  }

  /**
   * Check if user can manage users
   * Only CEO can manage users
   */
  static canManageUsers(role: UserRole): boolean {
    return this.permissions[role].canManageUsers;
  }

  /**
   * Check if user can view system metrics
   */
  static canViewSystemMetrics(role: UserRole): boolean {
    return this.permissions[role].canViewSystemMetrics;
  }

  /**
   * Validate that a user action is allowed
   */
  static validateAction(
    role: UserRole,
    action: 'view' | 'moderate' | 'manage' | 'admin',
    resourceType: 'aggregated' | 'individual' | 'content' | 'users' | 'metrics'
  ): boolean {
    // No one can view individual resources
    if (action === 'view' && resourceType === 'individual') {
      return false;
    }

    // CEO can do anything except view individual reports
    if (role === 'ceo') {
      return true;
    }

    // Admin can view aggregated, moderate content, view metrics
    if (role === 'admin') {
      if (action === 'manage') return false;
      return true;
    }

    // Operators can only view aggregated data
    if (role === 'operator') {
      return action === 'view' && resourceType === 'aggregated';
    }

    return false;
  }
}