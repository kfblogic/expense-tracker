import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email({ message: 'Email-nya kurang bener' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
});

export const transactionSchema = z.object({
  amount: z.coerce
    .number({ message: 'Isi angka aja' })
    .positive({ message: 'Jumlahnya harus lebih dari 0' })
    .max(1_000_000_000_000, { message: 'Kegedean, cek lagi' }),
  categoryId: z.string().uuid({ message: 'Pilih kategori dulu' }),
  transactionDate: z
    .string()
    .min(1, { message: 'Isi tanggalnya' })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Tanggalnya nggak valid' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Catatannya kepanjangan (maks 500)' })
    .optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Kasih nama kategorinya' })
    .max(50, { message: 'Nama kategori maks 50 huruf' }),
});

export const budgetSchema = z.object({
  categoryId: z.string().uuid({ message: 'Pilih kategori dulu' }),
  amountLimit: z.coerce
    .number({ message: 'Isi angka aja' })
    .positive({ message: 'Limit-nya harus lebih dari 0' })
    .max(1_000_000_000_000, { message: 'Kegedean, cek lagi' }),
});

export type AuthInput = z.infer<typeof authSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
