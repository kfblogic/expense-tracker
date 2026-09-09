export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null; // null jika kategori bawaan/default
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description?: string | null;
  transaction_date: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount_limit: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MonthlySummary {
  totalExpense: number;
  previousMonthExpense: number;
  percentageChange: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  }[];
}
