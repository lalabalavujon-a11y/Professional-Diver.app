import { useEffect, useState } from "react";

const REFERRAL_STORAGE_KEY = "affiliate_referral_code";
const REFERRAL_EXPIRY_DAYS = 30; // Referral code expires after 30 days

/**
 * Hook to capture and manage affiliate referral codes from URL
 * Stores the referral code in localStorage for later use during signup
 */
export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if referral code exists in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");

    if (refParam) {
      console.log("Referral code detected in URL:", refParam);
      
      // Store the referral code
      const referralData = {
        code: refParam,
        timestamp: Date.now(),
        expiry: Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralData));
      setReferralCode(refParam);
      console.log("Referral code stored in localStorage:", refParam);

      // Track the click on the server (non-blocking)
      trackReferralClick(refParam).catch(err => {
        console.warn("Background click tracking failed (non-critical):", err);
      });

      // Clean up URL by removing the ref parameter (optional, for cleaner URLs)
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("ref");
        window.history.replaceState({}, "", newUrl.toString());
      } catch (e) {
        // If URL manipulation fails, that's okay - the code is already stored
        console.warn("Could not clean URL:", e);
      }
    } else {
      // Check if we have a stored referral code that hasn't expired
      const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (stored) {
        try {
          const referralData = JSON.parse(stored);
          if (referralData.expiry > Date.now()) {
            setReferralCode(referralData.code);
          } else {
            // Expired, remove it
            localStorage.removeItem(REFERRAL_STORAGE_KEY);
          }
        } catch (e) {
          // Invalid data, remove it
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
      }
    }
  }, []);

  /**
   * Get the stored referral code
   */
  const getReferralCode = (): string | null => {
    if (referralCode) return referralCode;

    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (stored) {
      try {
        const referralData = JSON.parse(stored);
        if (referralData.expiry > Date.now()) {
          return referralData.code;
        } else {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
    }
    return null;
  };

  /**
   * Clear the stored referral code
   */
  const clearReferralCode = () => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    setReferralCode(null);
  };

  return {
    referralCode: getReferralCode(),
    clearReferralCode,
  };
}

/**
 * Track referral click on the server
 */
async function trackReferralClick(affiliateCode: string) {
  try {
    const clickData = {
      ipAddress: undefined, // Will be captured server-side
      userAgent: navigator.userAgent,
      referrerUrl: document.referrer || undefined,
      landingPage: window.location.pathname,
    };

    // Use relative URL - will work with same-origin or proxy
    const apiUrl = "/api/affiliate/track-click";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        affiliateCode,
        clickData,
      }),
    });

    if (!response.ok) {
      console.warn(`Referral click tracking returned ${response.status}`, {
        affiliateCode,
        status: response.status,
      });
    } else {
      console.log("Referral click tracked successfully:", affiliateCode);
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    // The referral code is still stored in localStorage, which is the important part
    console.warn("Failed to track referral click (code still stored):", error);
  }
}

