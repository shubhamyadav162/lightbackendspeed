import { createClient } from '@supabase/supabase-js';
import { create } from 'zustand';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define store types
type Transaction = {
  id: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  gateway_name?: string;
  created_at: string;
  updated_at: string;
};

type Settlement = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  net_amount: number;
  fees: number;
  created_at: string;
  updated_at: string;
};

type Alert = {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
};

interface RealtimeState {
  transactions: Record<string, Transaction>;
  recentTransactions: Transaction[];
  settlements: Record<string, Settlement>;
  alerts: Alert[];
  unreadAlerts: number;
  isConnected: boolean;
  initializeRealtime: (merchantId: string) => void;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  disconnectRealtime: () => void;
}

// Create store
export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  transactions: {},
  recentTransactions: [],
  settlements: {},
  alerts: [],
  unreadAlerts: 0,
  isConnected: false,

  initializeRealtime: (merchantId: string) => {
    // Get current state
    const state = get();
    
    // If already connected, return
    if (state.isConnected) return;
    
    // Subscribe to transactions
    const transactionSubscription = supabase
      .channel('transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `merchant_id=eq.${merchantId}`,
      }, (payload) => {
        const transaction = payload.new as Transaction;
        
        // Update transactions record
        set((state) => ({
          transactions: {
            ...state.transactions,
            [transaction.id]: transaction,
          },
          recentTransactions: [
            transaction,
            ...state.recentTransactions.filter(t => t.id !== transaction.id)
          ].slice(0, 10), // Keep only 10 most recent transactions
        }));
      })
      .subscribe();
    
    // Subscribe to settlements
    const settlementSubscription = supabase
      .channel('settlements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'settlements',
        filter: `merchant_id=eq.${merchantId}`,
      }, (payload) => {
        const settlement = payload.new as Settlement;
        
        // Update settlements record
        set((state) => ({
          settlements: {
            ...state.settlements,
            [settlement.id]: settlement,
          },
        }));
      })
      .subscribe();
    
    // Subscribe to alerts
    const alertSubscription = supabase
      .channel('alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `merchant_id=eq.${merchantId}`,
      }, (payload) => {
        const alert = payload.new as Alert;
        
        // Update alerts array and increment unread count
        set((state) => ({
          alerts: [alert, ...state.alerts],
          unreadAlerts: state.unreadAlerts + 1,
        }));
      })
      .subscribe();
    
    // Set as connected
    set({ isConnected: true });
    
    // Store subscriptions in window for cleanup
    if (typeof window !== 'undefined') {
      (window as any).__supabaseSubscriptions = {
        transactionSubscription,
        settlementSubscription,
        alertSubscription,
      };
    }
  },
  
  markAlertAsRead: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true } 
          : alert
      ),
      unreadAlerts: Math.max(0, state.unreadAlerts - 1),
    }));
  },
  
  markAllAlertsAsRead: () => {
    set((state) => ({
      alerts: state.alerts.map(alert => ({ ...alert, is_resolved: true })),
      unreadAlerts: 0,
    }));
  },
  
  disconnectRealtime: () => {
    // Clean up subscriptions
    if (typeof window !== 'undefined') {
      const subs = (window as any).__supabaseSubscriptions;
      if (subs) {
        subs.transactionSubscription.unsubscribe();
        subs.settlementSubscription.unsubscribe();
        subs.alertSubscription.unsubscribe();
        delete (window as any).__supabaseSubscriptions;
      }
    }
    
    set({ isConnected: false });
  },
}));

// Hooks for specific realtime data
export const useRecentTransactions = () => useRealtimeStore((state) => state.recentTransactions);
export const useTransaction = (id: string) => useRealtimeStore((state) => state.transactions[id]);
export const useSettlement = (id: string) => useRealtimeStore((state) => state.settlements[id]);
export const useAlerts = () => useRealtimeStore((state) => state.alerts);
export const useUnreadAlertsCount = () => useRealtimeStore((state) => state.unreadAlerts);
export const useIsConnected = () => useRealtimeStore((state) => state.isConnected);

// Initialize realtime on authentication
export const initializeRealtimeForMerchant = (merchantId: string) => {
  useRealtimeStore.getState().initializeRealtime(merchantId);
};

// Disconnect on logout
export const disconnectRealtime = () => {
  useRealtimeStore.getState().disconnectRealtime();
}; 