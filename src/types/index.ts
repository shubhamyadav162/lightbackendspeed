export interface PaymentGateway {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  priority: number;
  success_rate: number;
  api_endpoint: string;
  webhook_endpoint?: string;
  supported_methods: string[];
  created_at: string;
  updated_at: string;
  avg_response_time?: number;
  health_score?: number;
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  currency_codes?: string[];
  merchant_category_codes?: string[];
  credentials?: Record<string, any>;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  business_type?: string;
  api_key: string;
  api_salt: string;
  is_active: boolean;
  webhook_url?: string;
  callback_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  txn_id: string;
  merchant_id: string;
  gateway_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_method?: string;
  gateway_txn_id?: string;
  gateway_response?: Record<string, any>;
  user_details?: Record<string, any>;
  metadata?: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
} 