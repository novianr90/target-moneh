import * as env from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = (env as any).PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey =
	(env as any).PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	(env as any).PUBLIC_SUPABASE_ANON_KEY ||
	'placeholder';

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
	cookieOptions: {
		name: 'sb-target-moneh-auth-token'
	}
});
