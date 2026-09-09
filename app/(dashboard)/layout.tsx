import { createClient } from '@/lib/supabase/server';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { ToastProvider } from '@/components/ui/Toast';
import TopProgress from '@/components/ui/TopProgress';
import { categoryVarKey } from '@/lib/category-colors';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Warna kategori kustom → CSS var `--catc-*` di :root. Semua pemanggil
  // categoryColor() (kotak-cat, chart) otomatis ikut, tanpa prop plumbing.
  let colorVars = '';
  if (user) {
    const { data: cats } = await supabase
      .from('categories')
      .select('name, color')
      .eq('user_id', user.id)
      .not('color', 'is', null);
    colorVars = (cats ?? [])
      .map((c) => `--catc-${categoryVarKey(c.name)}:${c.color};`)
      .join('');
  }

  return (
    <ToastProvider>
      {colorVars && (
        <style dangerouslySetInnerHTML={{ __html: `:root{${colorVars}}` }} />
      )}
      <TopProgress />
      <div className="flex min-h-screen flex-col bg-ground">
        <DashboardHeader userEmail={user?.email} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
