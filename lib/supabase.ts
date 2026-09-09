import { createClient } from './supabase/client';

/**
 * Instance default Supabase client untuk Client Component
 */
export const supabase = createClient();

export { createClient as createBrowserClient } from './supabase/client';
