// OTPless Configuration
// You need to get your App ID from https://otpless.com/dashboard
export const OTPLESS_APP_ID = 'YOUR_OTPLESS_APP_ID';

// OTPless SDK loader
let otplessPromise: Promise<void> | null = null;

export const loadOTPlessSDK = (): Promise<void> => {
  if (otplessPromise) return otplessPromise;

  otplessPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).OTPless) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'otpless-sdk';
    script.type = 'text/javascript';
    script.src = 'https://otpless.com/v4/headless.js';
    script.setAttribute('data-appid', OTPLESS_APP_ID);

    script.onload = () => {
      console.log('[OTPless] SDK loaded successfully');
      resolve();
    };

    script.onerror = () => {
      console.error('[OTPless] Failed to load SDK');
      reject(new Error('Failed to load OTPless SDK'));
    };

    document.head.appendChild(script);
  });

  return otplessPromise;
};

// OTPless response types
export interface OTPlessUser {
  userId: string;
  token: string;
  timestamp: string;
  identities: Array<{
    identityType: string;
    identityValue: string;
    channel: string;
    verified: boolean;
    name?: string;
  }>;
  idToken?: string;
}

export interface OTPlessCallback {
  responseType: 'ONETAP' | 'OTP' | 'OAUTH';
  response?: OTPlessUser;
  statusCode?: number;
  errorMessage?: string;
}
