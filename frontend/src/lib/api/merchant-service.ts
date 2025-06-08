import apiClient from './api-client';
import * as z from 'zod';

/**
 * Merchant status enum
 */
export enum MerchantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Merchant schema for validation
 */
export const MerchantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  business_name: z.string().min(2),
  business_type: z.string(),
  business_address: z.string().optional(),
  status: z.nativeEnum(MerchantStatus),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Merchant type derived from schema
 */
export type Merchant = z.infer<typeof MerchantSchema>;

/**
 * Create merchant payload schema
 */
export const CreateMerchantSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  business_name: z.string().min(2),
  business_type: z.string(),
  business_address: z.string().optional(),
  website_url: z.string().url().optional(),
});

/**
 * Create merchant payload type
 */
export type CreateMerchantPayload = z.infer<typeof CreateMerchantSchema>;

/**
 * Update merchant payload schema
 */
export const UpdateMerchantSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  business_name: z.string().min(2).optional(),
  business_type: z.string().optional(),
  business_address: z.string().optional(),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
});

/**
 * Update merchant payload type
 */
export type UpdateMerchantPayload = z.infer<typeof UpdateMerchantSchema>;

// Get API base URL from the environment or use a default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Schemas
const merchantProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  logo_url: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  }).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

const merchantRegistrationSchema = z.object({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  }).optional()
});

const dashboardStatsSchema = z.object({
  total_transactions: z.number(),
  total_volume: z.number(),
  success_rate: z.number(),
  average_transaction_value: z.number(),
  transaction_count_by_status: z.record(z.string(), z.number()),
  volume_by_date: z.array(
    z.object({
      date: z.string(),
      amount: z.number()
    })
  ),
  gateway_distribution: z.array(
    z.object({
      gateway: z.string(),
      count: z.number(),
      volume: z.number()
    })
  )
});

const webhookSchema = z.object({
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  url: z.string().url(),
  secret: z.string(),
  event_types: z.array(z.string()),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

const webhookCreateSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.string()),
  isActive: z.boolean().default(true)
});

const webhookUpdateSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.string()),
  isActive: z.boolean()
});

class MerchantService {
  /**
   * Register a new merchant
   */
  async registerMerchant(data: z.infer<typeof merchantRegistrationSchema>) {
    const response = await apiClient.post('/merchants/register', data);
    return merchantProfileSchema.parse(response.data);
  }

  /**
   * Get the authenticated merchant's profile
   */
  async getMerchantProfile() {
    const response = await apiClient.get('/merchants/profile');
    return merchantProfileSchema.parse(response.data);
  }

  /**
   * Update the authenticated merchant's profile
   */
  async updateMerchantProfile(data: Partial<z.infer<typeof merchantProfileSchema>>) {
    const response = await apiClient.put('/merchants/profile', data);
    return merchantProfileSchema.parse(response.data);
  }

  /**
   * Upload merchant logo
   */
  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await apiClient.post('/merchants/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.logo_url;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await apiClient.get(`/merchants/stats?period=${period}`);
    return dashboardStatsSchema.parse(response.data);
  }

  /**
   * Get webhooks for merchant
   */
  async getWebhooks() {
    const response = await apiClient.get('/merchants/webhooks');
    return z.array(webhookSchema).parse(response.data);
  }

  /**
   * Create a new webhook
   */
  async createWebhook(merchantId: string, data: z.infer<typeof webhookCreateSchema>) {
    const response = await apiClient.post(`/merchants/${merchantId}/webhooks`, {
      url: data.url,
      event_types: data.eventTypes,
      is_active: data.isActive
    });
    
    return webhookSchema.parse(response.data);
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(
    merchantId: string,
    webhookId: string,
    data: z.infer<typeof webhookUpdateSchema>
  ) {
    const response = await apiClient.put(`/merchants/${merchantId}/webhooks/${webhookId}`, {
      url: data.url,
      event_types: data.eventTypes,
      is_active: data.isActive
    });
    
    return webhookSchema.parse(response.data);
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(merchantId: string, webhookId: string) {
    await apiClient.delete(`/merchants/${merchantId}/webhooks/${webhookId}`);
    return true;
  }
}

export const merchantService = new MerchantService(); 