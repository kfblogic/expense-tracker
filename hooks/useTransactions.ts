'use client';

import { useState } from 'react';
import { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return {
    transactions,
    loading,
    error,
    setTransactions,
    setLoading,
    setError,
  };
}
