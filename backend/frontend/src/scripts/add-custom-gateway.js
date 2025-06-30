// Script to add NextGen Techno Ventures Custom Gateway
// Run this in browser console when on the dashboard page

async function addCustomGateway() {
  try {
    console.log('🚀 Adding NextGen Techno Ventures Custom Gateway...');
    
    // Import the API service (this assumes the module is available globally)
    const { apiService } = await import('../services/api.ts');
    
    const customGateway = {
      name: 'NextGen Techno Ventures',
      provider: 'custom',
      client_id: '682aefe4e352d264171612c0',
      api_id: 'FRQT0XKLHY',
      api_secret: 'S84LOJ3U0N',
      priority: 1,
      monthly_limit: 10000000,
      is_active: true,
    };

    const result = await apiService.createGateway(customGateway);
    console.log('✅ Custom Gateway added successfully:', result);
    
    // Refresh the page to show the new gateway
    window.location.reload();
    
    return result;
  } catch (error) {
    console.error('❌ Failed to add custom gateway:', error);
    
    // Check if gateway already exists
    if (error.response?.status === 409 || 
        error.response?.data?.error?.includes('already exists') ||
        error.response?.data?.error?.includes('duplicate')) {
      console.warn('⚠️ Gateway already exists, skipping...');
      return { message: 'Gateway already exists' };
    }
    
    throw error;
  }
}

// Auto-run the function
addCustomGateway(); 