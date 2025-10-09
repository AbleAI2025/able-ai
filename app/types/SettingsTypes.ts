
export type FlowStep = 'connecting' | 'payment-method' | 'success';

export type UserRole = 'BUYER' | 'GIG_WORKER';

export interface UserSettingsData {
  displayName: string;
  email: string;
  phone?: string | null; // Added phone field
  // Stripe Connect related fields (essential for Gig Workers, optional for Buyers unless they also act as sellers)
  stripeCustomerId: string | null; // The Stripe customer ID
  stripeAccountStatus:
  | "connected"
  | "pending_verification"
  | "incomplete"
  | "restricted"
  | "disabled"
  | null;
  stripeConnectAccountId: string | null; // The Stripe Connect Account ID
  canReceivePayouts: boolean; // Derived on backend, true if Stripe account is fully setup and can receive payouts

  // Enhanced Stripe status fields for detailed capability checking
  buyerConnected?: boolean;    // Customer account exists
  canPay?: boolean;           // Customer can make payments (not delinquent)
  workerConnected?: boolean;  // Connect account exists  
  canEarn?: boolean;          // Connect account can receive transfers

  lastRole: UserRole;
  notificationPreferences: {
    email: {
      gigUpdates: boolean;
      platformAnnouncements: boolean;
      marketing?: boolean;
    };
    sms: {
      gigAlerts: boolean;
    };
  };
  // Add other settings fields as needed (e.g., privacy settings)
  privacySettings: {
    // Added privacy settings field
    profileVisibility: boolean;
    // Add other privacy settings fields as needed
  };
}
