import apiClient from './api-client';
import { z } from 'zod';

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Transaction schema for validation
 */
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  gateway_id: z.string().uuid().optional(),
  gateway_transaction_id: z.string().optional(),
  status: z.nativeEnum(TransactionStatus),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Transaction type derived from schema
 */
export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Create transaction payload schema
 */
export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  return_url: z.string().url(),
});

/**
 * Create transaction payload type
 */
export type CreateTransactionPayload = z.infer<typeof CreateTransactionSchema>;

/**
 * Transaction service for handling transaction-related API requests
 */
export const transactionService = {
  /**
   * Create a new transaction
   */
  createTransaction: async (data: CreateTransactionPayload): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', data);
    return TransactionSchema.parse(response);
  },

  /**
   * Get a transaction by ID
   */
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${id}`);
    return TransactionSchema.parse(response);
  },

  /**
   * Get all transactions for the authenticated merchant
   */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{ transactions: Transaction[]; total: number }> => {
    // Convert params to query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    
    return {
      transactions: z.array(TransactionSchema).parse(response.transactions),
      total: z.number().parse(response.total),
    };
  },

  /**
   * Refund a transaction
   */
  refundTransaction: async (
    id: string,
    data: { amount?: number; reason?: string }
  ): Promise<Transaction> => {
    const response = await apiClient.post(`/transactions/${id}/refund`, data);
    return TransactionSchema.parse(response);
  },

  /**
   * Cancel a pending transaction
   */
  cancelTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.post(`/transactions/${id}/cancel`, {});
    return TransactionSchema.parse(response);
  },
};

export default transactionService; 