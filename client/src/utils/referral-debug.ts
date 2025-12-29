/**
 * Debug utility to check referral code status
 * Call this from browser console: window.checkReferral()
 */
export function setupReferralDebug() {
  if (typeof window !== 'undefined') {
    (window as any).checkReferral = () => {
      const stored = localStorage.getItem('affiliate_referral_code');
      const urlParams = new URLSearchParams(window.location.search);
      const refInUrl = urlParams.get('ref');
      
      console.log('=== Referral Code Debug ===');
      console.log('Referral code in URL:', refInUrl);
      console.log('Stored referral code:', stored ? JSON.parse(stored) : 'None');
      console.log('Current URL:', window.location.href);
      console.log('Referrer:', document.referrer);
      
      return {
        urlParam: refInUrl,
        stored: stored ? JSON.parse(stored) : null,
        currentUrl: window.location.href,
        referrer: document.referrer,
      };
    };
    
    console.log('Referral debug function available. Call window.checkReferral() to check status.');
  }
}








