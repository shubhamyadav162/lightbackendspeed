import { useMemo } from 'react';
import TransactionService from '@/lib/api/transaction-service';

export const useTransactionService = () => {
  // Memoize the transaction service instance
  const transactionService = useMemo(() => new TransactionService(), []);
  
  return transactionService;
};

export default useTransactionService; 