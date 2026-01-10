# Force SUPER_ADMIN Login

If you're logged in as a regular user instead of SUPER_ADMIN, follow these steps:

## Option 1: Log Out and Log Back In (Recommended)

1. **Log out** from the application
2. **Log back in** with these credentials:
   - **Email:** `lalabalavu.jon@gmail.com`
   - **Password:** `Admin123`

## Option 2: Force Login via Browser Console

Open your browser's developer console (F12 or Cmd+Option+I) and run:

```javascript
// Clear any existing auth data
localStorage.removeItem('userEmail');
localStorage.removeItem('rememberedEmail');
localStorage.removeItem('rememberedPassword');

// Set the Super Admin email
localStorage.setItem('userEmail', 'lalabalavu.jon@gmail.com');

// Force reload to pick up the new email
console.log('✅ Forced SUPER_ADMIN login. Reloading page...');
window.location.reload();
```

## Option 3: Check Current Email

To see what email is currently stored, run this in the console:

```javascript
console.log('Current email:', localStorage.getItem('userEmail'));
```

If it's not `lalabalavu.jon@gmail.com`, that's the problem. Use Option 2 to fix it.



