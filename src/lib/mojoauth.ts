// MojoAuth Configuration
export const MOJOAUTH_API_KEY = '94117c89-74fd-44f5-9025-f6b4cceabea0';

// MojoAuth response types
export interface MojoAuthUser {
  identifier: string;
  user_id: string;
  oauth: {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
  };
  user: {
    created_at: string;
    identifier: string;
    identities: Array<{
      id: string;
      type: string;
    }>;
    is_verified: boolean;
    updated_at: string;
  };
}

export interface MojoAuthConfig {
  language?: string;
  redirect_url?: string;
  source: Array<{
    type: 'phone' | 'email';
    feature: 'otp' | 'magiclink';
  }>;
}
