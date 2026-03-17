import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEMO_TRADE_LIMIT = 5;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// GET — fetch current trade count for this IP
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  const { data, error } = await supabase
    .from('demo_trade_limits')
    .select('trade_count')
    .eq('ip_address', ip)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ trade_count: 0 }, { status: 200 });
  }

  return NextResponse.json({ trade_count: data?.trade_count ?? 0 });
}

// POST — increment trade count for this IP (only if under limit)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Check existing record
  const { data: existing } = await supabase
    .from('demo_trade_limits')
    .select('id, trade_count')
    .eq('ip_address', ip)
    .maybeSingle();

  const currentCount = existing?.trade_count ?? 0;

  if (currentCount >= DEMO_TRADE_LIMIT) {
    return NextResponse.json(
      { trade_count: currentCount, error: 'Demo trade limit reached' },
      { status: 403 }
    );
  }

  const newCount = currentCount + 1;

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('demo_trade_limits')
      .update({ trade_count: newCount, last_trade_at: new Date().toISOString() })
      .eq('ip_address', ip);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('demo_trade_limits')
      .insert({ ip_address: ip, trade_count: newCount, last_trade_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ trade_count: newCount });
}
