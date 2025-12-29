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
        createdAt: new Date('2024-01-01T00:00:00Z'), // Project founder - member since beginning
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
        createdAt: new Date('2024-01-15T00:00:00Z'), // Early admin member
        updatedAt: new Date(),
      }
    ];

    // Partner Admin accounts (admin access but no affiliate/finance access)
    const partnerAdmins = [
      {
        id: 'partner-admin-1',
        email: 'freddierussell.joseph@yahoo.com',
        name: 'Freddie Joseph',
        role: 'PARTNER_ADMIN',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        restrictedAccess: ['affiliate', 'finance', 'revenue', 'billing', 'payments'],
        purpose: 'Platform Development Partner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'partner-admin-2',
        email: 'deesuks@gmail.com',
        name: 'Dilo Suka',
        role: 'PARTNER_ADMIN',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        restrictedAccess: ['affiliate', 'finance', 'revenue', 'billing', 'payments'],
        purpose: 'Platform Development Partner',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Lifetime access users for testing and marketing
    // Note: deesuks@gmail.com is PARTNER_ADMIN, not LIFETIME
    const lifetimeUsers = [
      {
        id: 'lifetime-3',
        email: 'steve44hall@yahoo.co.uk',
        name: 'Steve Hall',
        role: 'LIFETIME',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Testing and Marketing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'lifetime-4',
        email: 'mike@ascotwood.com',
        name: 'Mike Scarpellini',
        role: 'LIFETIME',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Testing and Marketing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      },
      {
        id: 'user-preview-1',
        email: 'preview@professionaldiver.app',
        name: 'Preview User',
        role: 'USER', // Normal user role (not admin)
        subscriptionType: 'LIFETIME', // Lifetime subscription access
        subscriptionStatus: 'ACTIVE',
        specialAccess: false, // No special admin access
        purpose: 'User Preview and Testing',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Store all special users
    // Store in order: superAdmins, partnerAdmins, then lifetimeUsers
    // Partner admins take priority over lifetime users if same email exists
    [...superAdmins, ...partnerAdmins, ...lifetimeUsers].forEach(user => {
      // Normalize email to lowercase for consistent storage and lookup
      const normalizedEmail = user.email.toLowerCase().trim();
      const normalizedUser = { ...user, email: normalizedEmail };
      
      // Only set if not already set (partner admins take priority)
      if (!this.specialUsers.has(normalizedEmail) || 
          (this.specialUsers.get(normalizedEmail)?.role !== 'PARTNER_ADMIN' && user.role === 'PARTNER_ADMIN')) {
        this.specialUsers.set(normalizedEmail, normalizedUser);
      }
    });

    console.log('Initialized special users:', {
      superAdmins: superAdmins.length,
      partnerAdmins: partnerAdmins.length,
      lifetimeUsers: lifetimeUsers.length,
      total: this.specialUsers.size
    });
  }

  // Check if user has special access
  hasSpecialAccess(email: string): boolean {
    return this.specialUsers.has(email);
  }

  // Get user details by email (alias for getSpecialUser for consistency)
  getUser(email: string) {
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    return this.specialUsers.get(normalizedEmail);
  }

  // Get user details by email
  getSpecialUser(email: string) {
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    return this.specialUsers.get(normalizedEmail);
  }

  // Update user profile information
  updateUser(email: string, updates: Partial<any>) {
    const user = this.specialUsers.get(email);
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date(),
      };
      this.specialUsers.set(email, updatedUser);
      return updatedUser;
    }
    return null;
  }

  // Get all super admins
  getSuperAdmins() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'SUPER_ADMIN');
  }

  // Get all lifetime users
  getLifetimeUsers() {
    return Array.from(this.specialUsers.values())
      .filter(user => user.role === 'LIFETIME');
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
}

export const userManagement = new UserManagementService();