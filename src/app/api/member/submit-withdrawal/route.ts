import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, payment_method, destination_address } = body as {
      amount: number;
      payment_method: string;
      destination_address: string;
    };

    // Basic field validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid withdrawal amount' }, { status: 400 });
    }
    if (!payment_method) {
      return NextResponse.json({ error: 'Please select a withdrawal method' }, { status: 400 });
    }
    if (!destination_address) {
      return NextResponse.json({ error: 'Please enter a destination account' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server-side: fetch the user's real wallet balance
    const { data: wallets, error: walletErr } = await supabase
      .from('wallets')
      .select('balance, is_demo')
      .eq('user_id', user.id);

    if (walletErr) {
      return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
    }

    const realWallet = wallets?.find((w: any) => w.is_demo === false);
    const realBalance = Number(realWallet?.balance ?? 0);

    // Validate: real balance must be > 0
    if (realBalance <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal is not available. You have no real balance.' },
        { status: 400 }
      );
    }

    // Validate: withdrawal amount must not exceed real balance
    if (amount > realBalance) {
      return NextResponse.json(
        { error: `Withdrawal amount exceeds your real balance of $${realBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Insert withdrawal request
    const { data: inserted, error: insertErr } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        currency: 'USD',
        payment_method,
        destination_address,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted?.id });
  } catch (err) {
    console.error('[submit-withdrawal] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
