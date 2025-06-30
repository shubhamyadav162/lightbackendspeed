
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  apiKey: string;
  client_key?: string;
  client_salt?: string;
  webhook_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  totalTransactions: number;
  totalVolume: number;
  lastActivity: string;
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  monthlyLimit: number;
  currentMonthVolume: number;
  // Commission & Financial Fields
  fee_percent?: number; // Commission percentage like 4.0%
  balance_due?: number; // Money owed to LightSpeedPay in paisa
  warn_threshold?: number; // Low balance threshold 
  commission_earned?: number; // Total commission earned
  last_payout?: string; // Last commission payout date
  last_payout_amount?: number; // Last payout amount
}

export type ClientStatus = 'active' | 'inactive' | 'suspended';
export type NotificationType = 'whatsapp' | 'email';
