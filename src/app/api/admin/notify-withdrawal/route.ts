import { NextRequest, NextResponse } from 'next/server';


const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tradiglo.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { withdrawal_id, user_email, user_name, amount, payment_method } = body;

    if (!withdrawal_id || !user_email || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }

    const displayName = user_name || user_email.split('@')[0] || 'Unknown User';
    const requestedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>New Withdrawal Request</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1e293b);padding:32px 40px 24px;border-bottom:1px solid #334155;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><span style="font-size:22px;font-weight:700;color:#60a5fa;letter-spacing:0.05em;">TRADIGLO</span><p style="margin:6px 0 0;font-size:13px;color:#64748b;">Admin Notification System</p></td>
                <td align="right"><span style="display:inline-block;background:#f97316;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);color:#fb923c;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">WITHDRAWAL REQUEST</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">New Withdrawal Request</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">A member has submitted a withdrawal request that requires your approval.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #334155;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;"><span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Member</span><p style="margin:4px 0 0;font-size:15px;color:#f1f5f9;font-weight:600;">${displayName}</p></td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;"><span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Email</span><p style="margin:4px 0 0;font-size:15px;color:#60a5fa;">${user_email}</p></td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;"><span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Amount</span><p style="margin:4px 0 0;font-size:20px;color:#fb923c;font-weight:700;">$${Number(amount).toFixed(2)} USD</p></td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;"><span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Method</span><p style="margin:4px 0 0;font-size:14px;color:#f1f5f9;">${payment_method || 'Not specified'}</p></td></tr>
                  <tr><td style="padding:8px 0 0;"><span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Requested At</span><p style="margin:4px 0 0;font-size:14px;color:#f1f5f9;">${requestedAt}</p></td></tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center"><a href="https://canonsite4265.builtwithrocket.new/admin/withdrawals" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Review in Admin Panel →</a></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;"><p style="margin:0;font-size:12px;color:#475569;text-align:center;">This is an automated notification from TRADIGLO Admin System.&lt;br/&gt;You are receiving this because you are registered as an administrator.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [ADMIN_EMAIL],
        subject: `💸 New Withdrawal Request: $${Number(amount).toFixed(2)} from ${displayName}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${res.status} ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notify-withdrawal] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
