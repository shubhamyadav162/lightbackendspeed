import { useState, useEffect } from 'react';
import { merchantService } from '@/lib/api/merchant-service';

interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
}

export function useMerchantProfile() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchantProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await merchantService.getMerchantProfile();
      setMerchant(data);
    } catch (err) {
      console.error('Error fetching merchant profile:', err);
      setError('Failed to load merchant profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantProfile();
  }, []);

  const updateProfile = async (data: Partial<Merchant>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedMerchant = await merchantService.updateMerchantProfile(data);
      setMerchant(updatedMerchant);
      return updatedMerchant;
    } catch (err) {
      console.error('Error updating merchant profile:', err);
      setError('Failed to update merchant profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const logoUrl = await merchantService.uploadLogo(file);
      
      if (merchant) {
        setMerchant({
          ...merchant,
          logo_url: logoUrl
        });
      }
      
      return logoUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    merchant,
    isLoading,
    error,
    fetchMerchantProfile,
    updateProfile,
    uploadLogo
  };
} 