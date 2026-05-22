import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tradiglo.com';

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [to],
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error('[withdrawal-action] Email error:', err);
  }
}

function buildMemberEmail(action: 'approved' | 'rejected', amount: number, adminNote: string | null, userEmail: string) {
  const isApproved = action === 'approved';
  const accentColor = isApproved ? '#22c55e' : '#ef4444';
  const statusLabel = isApproved ? 'APPROVED' : 'REJECTED';
  const statusMsg = isApproved
    ? `Your withdrawal of <strong>$${amount.toFixed(2)}</strong> has been approved and is being processed.`
    : `Your withdrawal of <strong>$${amount.toFixed(2)}</strong> has been rejected.`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Withdrawal ${statusLabel}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1e293b);padding:32px 40px 24px;border-bottom:1px solid #334155;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><span style="font-size:22px;font-weight:700;color:#60a5fa;letter-spacing:0.05em;">TRADIGLO</span><p style="margin:6px 0 0;font-size:13px;color:#64748b;">Withdrawal Notification</p></td>
                <td align="right"><span style="display:inline-block;background:${accentColor}20;border:1px solid ${accentColor}40;color:${accentColor};font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">${statusLabel}</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">Withdrawal ${statusLabel}</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">${statusMsg}</p>
            ${adminNote ? `<div style="background:#0f172a;border-radius:12px;border:1px solid #334155;padding:16px 20px;margin-bottom:24px;"><p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Admin Note</p><p style="margin:0;font-size:14px;color:#f1f5f9;">${adminNote}</p></div>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center"><a href="https://canonsite4265.builtwithrocket.new/dashboard/account" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">View My Account →</a></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;"><p style="margin:0;font-size:12px;color:#475569;text-align:center;">This is an automated notification from TRADIGLO.<br/>Account: ${userEmail}</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminEmail(action: 'approved' | 'rejected', amount: number, userEmail: string, adminNote: string | null) {
  const isApproved = action === 'approved';
  const accentColor = isApproved ? '#22c55e' : '#ef4444';
  const statusLabel = isApproved ? 'APPROVED' : 'REJECTED';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Withdrawal ${statusLabel}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1e293b);padding:32px 40px 24px;border-bottom:1px solid #334155;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><span style="font-size:22px;font-weight:700;color:#60a5fa;">TRADIGLO</span><p style="margin:6px 0 0;font-size:13px;color:#64748b;">Admin — Withdrawal Action Confirmation</p></td>
                <td align="right"><span style="display:inline-block;background:${accentColor}20;border:1px solid ${accentColor}40;color:${accentColor};font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">${statusLabel}</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">Withdrawal ${statusLabel}</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">You have ${action} a withdrawal request of <strong style="color:#f1f5f9;">$${amount.toFixed(2)}</strong> from <strong style="color:#60a5fa;">${userEmail}</strong>.</p>
            ${adminNote ? `<div style="background:#0f172a;border-radius:12px;border:1px solid #334155;padding:16px 20px;margin-bottom:24px;"><p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Your Note</p><p style="margin:0;font-size:14px;color:#f1f5f9;">${adminNote}</p></div>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center"><a href="https://canonsite4265.builtwithrocket.new/admin/withdrawals" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">View Withdrawals Panel →</a></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;"><p style="margin:0;font-size:12px;color:#475569;text-align:center;">TRADIGLO Admin System — Automated Confirmation</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, admin_note } = body as {
      id: string;
      action: 'approved' | 'rejected';
      admin_note?: string;
    };

    if (!id || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify admin is authenticated
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email!)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch withdrawal info for email notification
    const { data: withdrawal, error: fetchErr } = await supabase
      .from('withdrawals')
      .select('id, amount, user_id, status, users!withdrawals_user_id_fkey(email, full_name)')
      .eq('id', id)
      .single();

    if (fetchErr || !withdrawal) {
      console.error('[withdrawal-action] fetch error:', fetchErr);
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    // Use security definer RPC function to process withdrawal (bypasses RLS correctly)
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_process_withdrawal', {
      p_withdrawal_id: id,
      p_action: action,
      p_admin_note: admin_note || null,
    });

    if (rpcErr) {
      console.error('[withdrawal-action] RPC error:', rpcErr);
      // Fallback: direct status update only.
      // The DB trigger (on_withdrawal_status_change → handle_withdrawal_approval)
      // will automatically deduct wallet balance when status changes to 'approved'.
      // DO NOT manually deduct balance here to avoid double deduction.
      const { error: updateErr } = await supabase
        .from('withdrawals')
        .update({
          status: action,
          admin_note: admin_note || null,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'pending');

      if (updateErr) {
        console.error('[withdrawal-action] direct update error:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else if (rpcResult && !(rpcResult as any).success) {
      return NextResponse.json({ error: (rpcResult as any).error || 'Processing failed' }, { status: 400 });
    }

    const userEmail = (withdrawal.users as any)?.email || 'unknown@user.com';
    const amount = Number(withdrawal.amount);

    // Send email to member
    await sendEmail(
      userEmail,
      `Your withdrawal request has been ${action} — TRADIGLO`,
      buildMemberEmail(action, amount, admin_note || null, userEmail)
    );

    // Send confirmation email to admin
    await sendEmail(
      ADMIN_EMAIL,
      `Withdrawal ${action}: $${amount.toFixed(2)} from ${userEmail}`,
      buildAdminEmail(action, amount, userEmail, admin_note || null)
    );

    return NextResponse.json({ success: true, action, amount });
  } catch (err) {
    console.error('[withdrawal-action] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
