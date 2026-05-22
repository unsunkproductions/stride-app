import { NextRequest } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const CHECKIN_MESSAGES: Record<string, { title: string; body: string }> = {
  peak:     { title: 'STRIDE · Pico', body: 'Como você tá agora? Check-in de humor 🔥' },
  trough:   { title: 'STRIDE · Vale', body: 'Hora do check-in da tarde — como tá o alerta? 😐' },
  recovery: { title: 'STRIDE · Recuperação', body: 'Check-in da noite — feche o dia 🌙' },
};

export async function GET(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get('slot') || 'peak';
  const msg = CHECKIN_MESSAGES[slot] || CHECKIN_MESSAGES.peak;

  webpush.setVapidDetails(
    'mailto:stride@app.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: subs } = await supabase.from('push_subscriptions').select('endpoint, keys');
  if (!subs?.length) return Response.json({ sent: 0 });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
        JSON.stringify({ title: msg.title, body: msg.body })
      )
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return Response.json({ sent, total: subs.length });
}
