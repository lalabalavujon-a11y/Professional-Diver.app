// User management service for special accounts
export class UserManagementService {
  private specialUsers = new Map<string, any>();

  constructor() {
    this.initializeSpecialUsers();
  }

  // Initialize super admins and lifetime users
  private initializeSpecialUsers() {
    // Super Admin accounts
    const superAdmins = [
      {
        id: 'super-admin-1',
        email: 'lalabalavu.jon@gmail.com',
        name: 'Jon Lalabalavu',
        role: 'SUPER_ADMIN',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'super-admin-2', 
        email: 'sephdee@hotmail.com',
        name: 'Jon Lalabalavu',
        role: 'SUPER_ADMIN',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Partner Admin (AFFILIATE) users - Managed by Super Admin
    // These users have affiliate/partner capabilities and access to CRM features
    const partnerAdmins = [
      {
        id: 'partner-admin-1',
        email: 'freddierusseljoseph@yahoo.com',
        name: 'Freddie Russell Joseph',
        role: 'AFFILIATE',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Partner Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'partner-admin-2',
        email: 'deesuks@gmail.com', 
        name: 'Dilo Suka',
        role: 'AFFILIATE',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Partner Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'partner-admin-3',
        email: 'steve44hall@yahoo.co.uk',
        name: 'Steve Hall',
        role: 'AFFILIATE',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Partner Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'partner-admin-4',
        email: 'mike@ascotwood.com',
        name: 'Mike Scarpellini',
        role: 'AFFILIATE',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Partner Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Lifetime access users - Managed by Super Admin
    // These users have lifetime access with full platform features
    const lifetimeUsers = [
      {
        id: 'lifetime-5',
        email: 'eroni2519@gmail.com', // Eroni Cirikidaveta
        name: 'Eroni Cirikidaveta',
        role: 'LIFETIME',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE', // Email provided
        specialAccess: true,
        purpose: 'Testing and Marketing',
        note: 'Email address updated',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Enterprise users - Managed by Super Admin
    // Enterprise users have access to operations and CRM features
    // Add Enterprise users here or through Super Admin interface
    const enterpriseUsers: any[] = [
      // Example:
      // {
      //   id: 'enterprise-1',
      //   email: 'enterprise@example.com',
      //   name: 'Enterprise User',
      //   role: 'ENTERPRISE',
      //   subscriptionType: 'ANNUAL',
      //   subscriptionStatus: 'ACTIVE',
      //   specialAccess: true,
      //   purpose: 'Enterprise Account',
      //   createdAt: new Date(),
      //   updatedAt: new Date(),
      // }
    ];

    // Store all special users (normalize emails to lowercase for consistent lookup)
    [...superAdmins, ...partnerAdmins, ...lifetimeUsers, ...enterpriseUsers].forEach(user => {
      this.specialUsers.set(user.email.toLowerCase().trim(), user);
    });

    console.log('Initialized special users:', {
      superAdmins: superAdmins.length,
      partnerAdmins: partnerAdmins.length,
      lifetimeUsers: lifetimeUsers.length,
      enterpriseUsers: enterpriseUsers.length,
      total: this.specialUsers.size
    });
  }

  // Check if user has special access
  hasSpecialAccess(email: string): boolean {
    return this.specialUsers.has(email);
  }

  // Get user details by email (case-insensitive lookup)
  getSpecialUser(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Debug logging
    console.log(`[UserManagement.getSpecialUser] Looking up: "${email}" -> normalized: "${normalizedEmail}"`);
    console.log(`[UserManagement.getSpecialUser] Available keys:`, Array.from(this.specialUsers.keys()));
    
    // Try exact match first
    let user = this.specialUsers.get(normalizedEmail);
    if (user) {
      console.log(`[UserManagement.getSpecialUser] ✅ Found user:`, { email: user.email, role: user.role });
      return user;
    }
    
    // Try case-insensitive lookup (shouldn't be needed since we normalize on store)
    for (const [key, value] of this.specialUsers.entries()) {
      if (key.toLowerCase().trim() === normalizedEmail) {
        console.log(`[UserManagement.getSpecialUser] ✅ Found user (case-insensitive):`, { email: value.email, role: value.role });
        return value;
      }
    }
    
    console.log(`[UserManagement.getSpecialUser] ❌ User not found`);
    return undefined;
  }

  // Get all super admins
  getSuperAdmins() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'SUPER_ADMIN');
  }

  // Get all partner admins (AFFILIATE)
  getPartnerAdmins() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'AFFILIATE');
  }

  // Get all lifetime users
  getLifetimeUsers() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'LIFETIME');
  }

  // Get all enterprise users
  getEnterpriseUsers() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'ENTERPRISE');
  }

  // Update Eroni's email when provided
  updateEroniEmail(newEmail: string) {
    const eroniUser = Array.from(this.specialUsers.values())
      .find(user => user.name === 'Eroni Cirikidaveta');
    
    if (eroniUser) {
      // Remove old entry
      this.specialUsers.delete('eroni@pending.com');
      
      // Update email and status
      eroniUser.email = newEmail;
      eroniUser.subscriptionStatus = 'ACTIVE';
      eroniUser.note = 'Email address updated';
      eroniUser.updatedAt = new Date();
      
      // Store with new email
      this.specialUsers.set(newEmail, eroniUser);
      
      console.log(`Updated Eroni's email to: ${newEmail}`);
      return eroniUser;
    }
    
    return null;
  }

  // Get user role and access level
  getUserAccessLevel(email: string) {
    const user = this.getSpecialUser(email);
    
    if (!user) {
      return { role: 'USER', hasSpecialAccess: false };
    }

    return {
      role: user.role,
      hasSpecialAccess: user.specialAccess,
      subscriptionType: user.subscriptionType,
      subscriptionStatus: user.subscriptionStatus,
      purpose: user.purpose || null
    };
  }

  // List all special users for admin dashboard
  getAllSpecialUsers() {
    return Array.from(this.specialUsers.values())
      .sort((a, b) => {
        // Sort by role first (SUPER_ADMIN first), then by name
        if (a.role !== b.role) {
          return a.role === 'SUPER_ADMIN' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Check if a role change is allowed
   * Prevents downgrading Super Admins and creating new Super Admins
   */
  canChangeRole(email: string, newRole: string): boolean {
    // Cannot assign SUPER_ADMIN role (can only be set in code)
    if (newRole === 'SUPER_ADMIN') {
      return false;
    }

    // Check if user exists
    const user = this.getSpecialUser(email);
    if (!user) {
      // User not in special users - allow role change (will update database)
      return true;
    }

    // Cannot downgrade SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return false;
    }

    // Validate role enum
    const validRoles = ['USER', 'ENTERPRISE', 'AFFILIATE', 'LIFETIME'];
    if (!validRoles.includes(newRole)) {
      return false;
    }

    return true;
  }

  /**
   * Update user role
   * Updates role in specialUsers map
   * Note: Database update should be handled separately by the API endpoint
   */
  async updateUserRole(email: string, newRole: string): Promise<any | null> {
    // Validate role change
    if (!this.canChangeRole(email, newRole)) {
      throw new Error(`Cannot change role to ${newRole} for user ${email}`);
    }

    // Get user
    const user = this.getSpecialUser(email);
    if (!user) {
      // User not in special users - return null (database will be updated by API)
      return null;
    }

    // Update role
    const oldRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date();

    // Log role change for audit trail
    console.log(`[UserManagement] Role changed: ${email} from ${oldRole} to ${newRole}`);

    // Update in map
    this.specialUsers.set(email, user);

    return user;
  }
}

export const userManagement = new UserManagementService();