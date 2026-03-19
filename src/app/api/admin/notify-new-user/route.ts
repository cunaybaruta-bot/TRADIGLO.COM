import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, full_name, user_id, created_at } = body;

    if (!email || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Call the Supabase Edge Function to send admin email via Resend
    const { data, error } = await supabase.functions.invoke('notify-admin-new-user', {
      body: { email, full_name, user_id, created_at },
    });

    if (error) {
      console.error('[notify-new-user] Edge function error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[notify-new-user] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
