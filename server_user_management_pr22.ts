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

    // Lifetime access users for testing and marketing
    const lifetimeUsers = [
      {
        id: 'lifetime-1',
        email: 'freddierusseljoseph@yahoo.com',
        name: 'Freddie Russell Joseph',
        role: 'LIFETIME',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Testing and Marketing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'lifetime-2',
        email: 'deesuks@gmail.com', 
        name: 'Dilo Suka',
        role: 'LIFETIME',
        subscriptionType: 'LIFETIME',
        subscriptionStatus: 'ACTIVE',
        specialAccess: true,
        purpose: 'Testing and Marketing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      }
    ];

    // Store all special users
    [...superAdmins, ...lifetimeUsers].forEach(user => {
      this.specialUsers.set(user.email, user);
    });

    console.log('Initialized special users:', {
      superAdmins: superAdmins.length,
      lifetimeUsers: lifetimeUsers.length,
      total: this.specialUsers.size
    });
  }

  // Check if user has special access
  hasSpecialAccess(email: string): boolean {
    return this.specialUsers.has(email);
  }

  // Get user details by email
  getSpecialUser(email: string) {
    return this.specialUsers.get(email);
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