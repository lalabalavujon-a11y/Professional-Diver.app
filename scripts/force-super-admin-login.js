/**
 * Quick script to force SUPER_ADMIN login
 * Run this in the browser console to force login as Super Admin
 */

// Clear any existing auth data
localStorage.removeItem('userEmail');
localStorage.removeItem('rememberedEmail');
localStorage.removeItem('rememberedPassword');

// Set the Super Admin email
localStorage.setItem('userEmail', 'lalabalavu.jon@gmail.com');

// Force reload to pick up the new email
console.log('✅ Forced SUPER_ADMIN login. Reloading page...');
window.location.reload();



