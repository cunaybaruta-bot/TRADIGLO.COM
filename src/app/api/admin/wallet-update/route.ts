import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Service role client — bypasses RLS entirely
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Use service role key if available, otherwise fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin is authenticated via Supabase session
    const supabaseAuth = await createClient();
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: adminRecord } = await supabaseAuth
      .from('admin_users')
      .select('id')
      .eq('email', user.email!)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { wallet_id, new_balance, action } = body as {
      wallet_id: string;
      new_balance?: number;
      action: 'update' | 'reset_demo';
    };

    if (!wallet_id || !action) {
      return NextResponse.json({ error: 'Missing wallet_id or action' }, { status: 400 });
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();

    if (action === 'reset_demo') {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: 100000, updated_at: new Date().toISOString() })
        .eq('id', wallet_id);

      if (error) {
        console.error('[wallet-update] reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, new_balance: 100000 });
    }

    if (action === 'update') {
      if (new_balance === undefined || new_balance === null || isNaN(new_balance) || new_balance < 0) {
        return NextResponse.json({ error: 'Invalid balance value' }, { status: 400 });
      }

      const { error } = await supabase
        .from('wallets')
        .update({ balance: new_balance, updated_at: new Date().toISOString() })
        .eq('id', wallet_id);

      if (error) {
        console.error('[wallet-update] update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, new_balance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[wallet-update] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
