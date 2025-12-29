import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserStatusBadge from "@/components/user-status-badge";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { useLocation } from "wouter";

const demoUsers = [
  {
    id: 'admin',
    name: 'Admin User',
    email: 'lalabalavu.jon@gmail.com',
    role: 'ADMIN',
    subscriptionType: 'LIFETIME',
    subscriptionDate: new Date('2024-01-01').toISOString(),
    trialExpiresAt: null
  },
  {
    id: 'lifetime-1',
    name: 'Lifetime Member 1',
    email: 'eroni2519@gmail.com',
    role: 'LIFETIME',
    subscriptionType: 'LIFETIME',
    subscriptionDate: new Date('2024-01-01').toISOString(),
    trialExpiresAt: null
  },
  {
    id: 'annual',
    name: 'Annual Subscriber',
    email: 'annual@example.com',
    role: 'USER',
    subscriptionType: 'ANNUAL',
    subscriptionDate: new Date('2024-08-01').toISOString(), // Started Aug 1, 2024
    trialExpiresAt: null
  },
  {
    id: 'monthly',
    name: 'Monthly Subscriber',
    email: 'monthly@example.com',
    role: 'USER',
    subscriptionType: 'MONTHLY',
    subscriptionDate: new Date('2025-08-01').toISOString(), // Started Aug 1, 2025
    trialExpiresAt: null
  },
  {
    id: 'trial',
    name: 'Trial User',
    email: 'trial@example.com',
    role: 'USER',
    subscriptionType: 'TRIAL',
    subscriptionDate: null,
    trialExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours remaining
  },
  {
    id: 'trial-low',
    name: 'Trial User (Low Time)',
    email: 'triallow@example.com',
    role: 'USER',
    subscriptionType: 'TRIAL',
    subscriptionDate: null,
    trialExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes remaining
  }
];

export default function DemoUsers() {
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState(demoUsers[0]);

  const switchToDashboard = (user: any) => {
    // Set email in localStorage for dashboard to pick up
    localStorage.setItem('userEmail', user.email);
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleBasedNavigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">User Badge System Demo</h1>
          <p className="text-slate-600">
            Test different user roles and subscription types with their respective badges and countdown timers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Selection */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select Demo User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demoUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                      <div className="text-xs text-slate-400">
                        {user.role} • {user.subscriptionType}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant={selectedUser.id === user.id ? "default" : "outline"}
                        onClick={() => setSelectedUser(user)}
                        data-testid={`button-select-${user.id}`}
                      >
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => switchToDashboard(user)}
                        data-testid={`button-dashboard-${user.id}`}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Badge Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Badge Preview: {selectedUser.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <UserStatusBadge
                    role={selectedUser.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'LIFETIME' | 'AFFILIATE'}
                    subscriptionType={selectedUser.subscriptionType as 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME'}
                    subscriptionDate={selectedUser.subscriptionDate || undefined}
                    trialExpiresAt={selectedUser.trialExpiresAt || undefined}
                    userName={selectedUser.name}
                  />

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Badge Details:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li><strong>Role:</strong> {selectedUser.role}</li>
                      <li><strong>Subscription:</strong> {selectedUser.subscriptionType}</li>
                      {selectedUser.subscriptionDate && (
                        <li><strong>Started:</strong> {new Date(selectedUser.subscriptionDate).toLocaleDateString()}</li>
                      )}
                      {selectedUser.trialExpiresAt && (
                        <li><strong>Trial Expires:</strong> {new Date(selectedUser.trialExpiresAt).toLocaleString()}</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Expected Badge:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {selectedUser.role === 'ADMIN' && (
                        <li>👑 Crown badge (no countdown)</li>
                      )}
                      {selectedUser.role === 'LIFETIME' && (
                        <li>⭐ Gold star badge (no countdown)</li>
                      )}
                      {selectedUser.subscriptionType === 'ANNUAL' && (
                        <li>🥇 Gold medal with yearly countdown</li>
                      )}
                      {selectedUser.subscriptionType === 'MONTHLY' && (
                        <li>🥈 Silver medal with monthly countdown</li>
                      )}
                      {selectedUser.subscriptionType === 'TRIAL' && (
                        <li>⏰ Clock icon with 24-hour countdown</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}