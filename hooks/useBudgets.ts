'use client';

import { useState } from 'react';
import { Budget } from '@/types';

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return {
    budgets,
    loading,
    error,
    setBudgets,
    setLoading,
    setError,
  };
}
