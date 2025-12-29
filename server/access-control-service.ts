// Access control service for managing Partner Admin and Supervisor permissions
import { userManagement } from "./user-management";

export class AccessControlService {
  private accessPermissions = new Map<string, {
    email: string;
    role: 'PARTNER_ADMIN' | 'SUPERVISOR';
    operationsCenter: boolean;
    adminDashboard: boolean;
    crm: boolean;
    analytics: boolean;
    contentEditor: boolean;
    updatedAt: Date;
    updatedBy: string;
  }>();

  constructor() {
    // Initialize immediately - userManagement should be ready by the time this is imported
    this.initializeDefaultPermissions();
  }

  // Initialize default permissions (all disabled by default)
  // Sync with user management service to get actual Partner Admins
  private initializeDefaultPermissions() {
    // Get all special users and filter for Partner Admins
    const allSpecialUsers = userManagement.getAllSpecialUsers();
    const partnerAdmins = allSpecialUsers.filter(user => user.role === 'PARTNER_ADMIN');
    
    // Track unique users by name to avoid duplicates (Freddie has two email formats)
    const uniqueUsers = new Map<string, { email: string; name: string; id: string }>();
    
    partnerAdmins.forEach(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      const userName = user.name || normalizedEmail;
      
      // Use name as key to deduplicate (Freddie has two emails but same name)
      if (!uniqueUsers.has(userName)) {
        uniqueUsers.set(userName, { email: normalizedEmail, name: userName, id: user.id });
      } else {
        // If name exists, prefer the primary email (without 'alt' in the user ID)
        const existing = uniqueUsers.get(userName)!;
        // Keep the email that doesn't have 'alt' in the user ID (primary email)
        if (!user.id.includes('alt') && existing.id.includes('alt')) {
          uniqueUsers.set(userName, { email: normalizedEmail, name: userName, id: user.id });
        }
      }
    });

    // Initialize permissions for unique Partner Admins
    uniqueUsers.forEach(({ email, name }) => {
      // Only initialize if not already set (to preserve manual updates)
      if (!this.accessPermissions.has(email)) {
        this.accessPermissions.set(email, {
          email: email,
          role: 'PARTNER_ADMIN',
          operationsCenter: false, // Default: restricted
          adminDashboard: false,   // Default: restricted
          crm: false,              // Default: restricted
          analytics: false,        // Default: restricted
          contentEditor: false,    // Default: restricted
          updatedAt: new Date(),
          updatedBy: 'system'
        });
      }
    });

    console.log('✅ Initialized access control permissions:', {
      partnerAdminsFound: partnerAdmins.length,
      uniqueUsers: uniqueUsers.size,
      totalPermissions: this.accessPermissions.size,
      users: Array.from(uniqueUsers.values()).map(u => `${u.name} (${u.email})`),
      allPartnerAdmins: partnerAdmins.map(u => `${u.name} (${u.email}) - ${u.id}`)
    });
  }

  // Get access permissions for a user
  getAccessPermissions(email: string): {
    operationsCenter: boolean;
    adminDashboard: boolean;
    crm: boolean;
    analytics: boolean;
    contentEditor: boolean;
  } | null {
    const normalizedEmail = email.toLowerCase().trim();
    const permissions = this.accessPermissions.get(normalizedEmail);
    
    if (!permissions) {
      return null;
    }

    return {
      operationsCenter: permissions.operationsCenter,
      adminDashboard: permissions.adminDashboard,
      crm: permissions.crm,
      analytics: permissions.analytics,
      contentEditor: permissions.contentEditor
    };
  }

  // Check if user has access to a specific feature
  hasAccess(email: string, feature: 'operationsCenter' | 'adminDashboard' | 'crm' | 'analytics' | 'contentEditor'): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const permissions = this.accessPermissions.get(normalizedEmail);
    
    if (!permissions) {
      return false; // No permissions found = no access
    }

    return permissions[feature];
  }

  // Update access permissions for a user
  updateAccessPermissions(
    email: string, 
    updates: Partial<{
      operationsCenter: boolean;
      adminDashboard: boolean;
      crm: boolean;
      analytics: boolean;
      contentEditor: boolean;
    }>,
    updatedBy: string
  ): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.accessPermissions.get(normalizedEmail);

    if (!existing) {
      // Create new entry if doesn't exist
      this.accessPermissions.set(normalizedEmail, {
        email: normalizedEmail,
        role: 'PARTNER_ADMIN',
        operationsCenter: updates.operationsCenter ?? false,
        adminDashboard: updates.adminDashboard ?? false,
        crm: updates.crm ?? false,
        analytics: updates.analytics ?? false,
        contentEditor: updates.contentEditor ?? false,
        updatedAt: new Date(),
        updatedBy: updatedBy
      });
      return true;
    }

    // Update existing permissions
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      updatedBy: updatedBy
    };

    this.accessPermissions.set(normalizedEmail, updated);
    return true;
  }

  // Get all access permissions (for admin dashboard)
  // Syncs with user management service to ensure all Partner Admins are included
  getAllAccessPermissions(): Array<{
    email: string;
    name: string;
    role: string;
    operationsCenter: boolean;
    adminDashboard: boolean;
    crm: boolean;
    analytics: boolean;
    contentEditor: boolean;
    updatedAt: Date;
    updatedBy: string;
  }> {
    try {
      // Always sync to ensure we have the latest Partner Admins
      this.syncWithUserManagement();
      
      // If still empty after sync, try initializing again
      if (this.accessPermissions.size === 0) {
        console.log('Access permissions empty, re-initializing...');
        this.initializeDefaultPermissions();
        this.syncWithUserManagement();
      }
    
    const permissions = Array.from(this.accessPermissions.values())
      .map(perm => {
        try {
          return {
            ...perm,
            name: this.getUserName(perm.email),
            role: perm.role
          };
        } catch (error) {
          console.error(`Error processing permission for ${perm.email}:`, error);
          return {
            ...perm,
            name: perm.email, // Fallback to email if name lookup fails
            role: perm.role
          };
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
    
      console.log(`getAllAccessPermissions returning ${permissions.length} permissions:`, 
        permissions.map(p => `${p.name} (${p.email})`)
      );
      
      return permissions;
    } catch (error) {
      console.error('Error in getAllAccessPermissions:', error);
      // Return empty array instead of throwing to prevent API failure
      return [];
    }
  }

  // Sync access permissions with user management service
  // Ensures all Partner Admins are included even if they were added after initialization
  private syncWithUserManagement() {
    try {
      const allSpecialUsers = userManagement.getAllSpecialUsers();
      const partnerAdmins = allSpecialUsers.filter(user => user.role === 'PARTNER_ADMIN');
      
      console.log('Syncing access control - found Partner Admins:', partnerAdmins.length);
      
      // Track unique users by name
      const uniqueUsers = new Map<string, { email: string; name: string; id: string }>();
      
      partnerAdmins.forEach(user => {
        const normalizedEmail = user.email.toLowerCase().trim();
        const userName = user.name || normalizedEmail;
        
        if (!uniqueUsers.has(userName)) {
          uniqueUsers.set(userName, { email: normalizedEmail, name: userName, id: user.id });
        } else {
          const existing = uniqueUsers.get(userName)!;
          // Prefer primary email (without 'alt' in ID)
          if (!user.id.includes('alt') && existing.id.includes('alt')) {
            uniqueUsers.set(userName, { email: normalizedEmail, name: userName, id: user.id });
          }
        }
      });

      console.log('Unique Partner Admins after deduplication:', 
        Array.from(uniqueUsers.values()).map(u => `${u.name} (${u.email})`)
      );

      // Add any missing Partner Admins
      let addedCount = 0;
      uniqueUsers.forEach(({ email, name }) => {
        if (!this.accessPermissions.has(email)) {
          this.accessPermissions.set(email, {
            email: email,
            role: 'PARTNER_ADMIN',
            operationsCenter: false,
            adminDashboard: false,
            crm: false,
            analytics: false,
            contentEditor: false,
            updatedAt: new Date(),
            updatedBy: 'system'
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        console.log(`Added ${addedCount} new Partner Admin(s) to access control`);
      }
    } catch (error) {
      console.error('Error syncing with user management:', error);
    }
  }

  // Helper to get user name from email
  // Get name from user management service for accurate data
  private getUserName(email: string): string {
    const user = userManagement.getUser(email);
    if (user && user.name) {
      return user.name;
    }
    
    // Fallback to hardcoded map if user not found
    const userMap: Record<string, string> = {
      'freddierussell.joseph@yahoo.com': 'Freddie Joseph',
      'deesuks@gmail.com': 'Dilo Suka'
    };
    return userMap[email.toLowerCase()] || email;
  }

  // Add a new user to access control
  addUser(email: string, role: 'PARTNER_ADMIN' | 'SUPERVISOR', updatedBy: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (this.accessPermissions.has(normalizedEmail)) {
      return false; // User already exists
    }

    this.accessPermissions.set(normalizedEmail, {
      email: normalizedEmail,
      role: role,
      operationsCenter: false,
      adminDashboard: false,
      crm: false,
      analytics: false,
      contentEditor: false,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });

    return true;
  }
}

export const accessControlService = new AccessControlService();

