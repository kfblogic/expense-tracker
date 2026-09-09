import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validasi sesi user dengan aman di sisi server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sinkron preferensi tema (user_metadata → cookie 'theme') di satu tempat,
  // tanpa network tambahan. Root layout baca cookie ini untuk render anti-flash.
  const theme = user?.user_metadata?.theme;
  if (
    (theme === 'light' || theme === 'dark' || theme === 'system') &&
    request.cookies.get('theme')?.value !== theme
  ) {
    supabaseResponse.cookies.set('theme', theme, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    });
  }

  const pathname = request.nextUrl.pathname;

  // Halaman yang membutuhkan login
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/ringkasan');

  // Halaman autentikasi
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Jika belum login dan mengakses protected route -> arahkan ke /login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan mengakses halaman login/register -> arahkan ke /dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
