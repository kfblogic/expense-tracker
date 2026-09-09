'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authSchema } from '@/lib/validations';

const fieldLabel = 'stencil block text-xs tracking-widest text-ink-soft';
const fieldBox =
  'mt-1 block w-full border border-line bg-cream-deep px-3 py-2.5 text-sm text-ink outline-none focus:border-signal';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Input tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email atau password-nya salah.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Email belum dikonfirmasi. Cek inbox kamu dulu.');
        } else {
          setErrorMessage(error.message || 'Gagal masuk. Coba lagi.');
        }
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Koneksi bermasalah. Cek internet kamu.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="stencil inline-flex items-center gap-2 text-2xl text-chalk">
            <span className="slat grid h-9 w-9 place-items-center text-ink text-base">ET</span>
            Expense Tracker
          </Link>
        </div>

        <div className="bolted grain slat border-2 border-line px-6 py-7">
          <div className="stencil flex items-center justify-between border-b-2 border-dashed border-line pb-2 text-ink">
            <span className="text-lg">Masuk</span>
            <span className="text-xs tracking-widest text-ink-soft">AKUN</span>
          </div>

          {errorMessage && (
            <p className="mt-4 border border-signal bg-signal/10 px-3 py-2 text-sm text-signal-deep">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className={fieldLabel}>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className={fieldBox}
              />
            </label>

            <label className="block">
              <span className="flex items-center justify-between">
                <span className={fieldLabel}>Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="stencil text-xs tracking-wide text-board"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className={fieldBox}
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="stencil w-full border-2 border-signal-deep bg-signal px-4 py-2.5 text-sm tracking-widest text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-5 border-t-2 border-dashed border-line pt-4 text-center text-sm text-ink-soft">
            Belum punya akun?{' '}
            <Link href="/register" className="stencil text-board hover:text-board-deep">
              Bikin akun
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center">
          <Link href="/" className="stencil text-xs tracking-wide text-chalk/50 hover:text-chalk">
            ← Kembali
          </Link>
        </p>
      </div>
    </main>
  );
}
