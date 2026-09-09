'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authSchema } from '@/lib/validations';

const fieldLabel = 'stencil block text-xs tracking-widest text-ink-soft';
const fieldBox =
  'mt-1 block w-full border border-line bg-cream-deep px-3 py-2.5 text-sm text-ink outline-none focus:border-signal';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Input tidak valid');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password konfirmasinya beda');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('Email ini udah kedaftar. Login aja.');
        } else if (error.message.includes('Password should be at least')) {
          setErrorMessage('Password minimal 8 karakter.');
        } else {
          setErrorMessage(error.message || 'Gagal bikin akun.');
        }
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMessage(
          'Akun kebikin! Cek email kamu buat link konfirmasi, terus aktifin akunnya.'
        );
        setIsLoading(false);
      }
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
            <span className="text-lg">Daftar</span>
            <span className="text-xs tracking-widest text-ink-soft">AKUN BARU</span>
          </div>

          {errorMessage && (
            <p className="mt-4 border border-signal bg-signal/10 px-3 py-2 text-sm text-signal-deep">
              {errorMessage}
            </p>
          )}

          {successMessage ? (
            <div className="mt-4 border-2 border-dashed border-board px-4 py-5 text-center text-ink">
              <p className="stencil text-lg">Akun kebikin</p>
              <p className="mt-2 text-sm text-ink-soft">{successMessage}</p>
              <Link
                href="/login"
                className="stencil mt-4 inline-block border-2 border-signal-deep bg-signal px-5 py-2 text-sm tracking-widest text-chalk"
              >
                Ke halaman masuk
              </Link>
            </div>
          ) : (
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={fieldBox}
                />
              </label>

              <label className="block">
                <span className={fieldLabel}>Ulangi password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className={fieldBox}
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="stencil w-full border-2 border-signal-deep bg-signal px-4 py-2.5 text-sm tracking-widest text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Mendaftarkan…' : 'Buat akun'}
              </button>
            </form>
          )}

          <p className="mt-5 border-t-2 border-dashed border-line pt-4 text-center text-sm text-ink-soft">
            Udah punya akun?{' '}
            <Link href="/login" className="stencil text-board hover:text-board-deep">
              Masuk
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
