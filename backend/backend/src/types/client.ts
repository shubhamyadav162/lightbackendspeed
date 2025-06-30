
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  apiKey: string;
  status: 'active' | 'inactive' | 'suspended';
  totalTransactions: number;
  totalVolume: number;
  lastActivity: string;
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  monthlyLimit: number;
  currentMonthVolume: number;
}

export type ClientStatus = 'active' | 'inactive' | 'suspended';
export type NotificationType = 'whatsapp' | 'email';
