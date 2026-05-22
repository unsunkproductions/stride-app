import { NextRequest } from 'next/server';
import { createServerSupabase } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  const { subscription, profile } = await req.json();
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('push_subscriptions').upsert({
    profile,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  }, { onConflict: 'endpoint' });

  return Response.json({ ok: true });
}
