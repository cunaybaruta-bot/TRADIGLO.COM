// @ts-ignore
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
// @ts-ignore
declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { email, full_name, user_id, created_at } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@tradiglo.com";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const displayName = full_name || email?.split("@")[0] || "Unknown User";
    const registeredAt = created_at
      ? new Date(created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New User Registration</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#1e293b);padding:32px 40px 24px;border-bottom:1px solid #334155;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#60a5fa;letter-spacing:0.05em;">TRADIGLO</span>
                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">Admin Notification System</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:#22c55e20;border:1px solid #22c55e40;color:#22c55e;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">NEW USER</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">New User Registered</h2>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                A new user has just created an account on your platform.
              </p>

              <!-- User Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #334155;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Full Name</span>
                          <p style="margin:4px 0 0;font-size:15px;color:#f1f5f9;font-weight:600;">${displayName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Email Address</span>
                          <p style="margin:4px 0 0;font-size:15px;color:#60a5fa;">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                          <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">User ID</span>
                          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;font-family:monospace;">${user_id}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0;">
                          <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Registered At</span>
                          <p style="margin:4px 0 0;font-size:14px;color:#f1f5f9;">${registeredAt}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://canonsite4265.builtwithrocket.new/admin/users"
                       style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
                      View in Admin Panel →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;">
              <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                This is an automated notification from TRADIGLO Admin System.<br/>
                You are receiving this because you are registered as an administrator.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [ADMIN_EMAIL],
        subject: `🆕 New User Registered: ${displayName} (${email})`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error: ${res.status} ${errText}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
