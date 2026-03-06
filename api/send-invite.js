// api/send-invite.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var { email, inviterName } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CivicVerify <noreply@civicverify.org>',
        to: [email],
        subject: (inviterName || 'A fellow citizen') + ' invited you to CivicVerify',
        html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(11,37,69,0.08);">
            <div style="background: linear-gradient(135deg, #0B2545 0%, #1a3a6a 100%); padding: 32px 32px 24px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: #C5960C; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="color: #fff; font-weight: 700; font-size: 13px;">CV</span>
                </div>
                <span style="font-size: 20px; font-weight: 700; color: #fff;">Civic<span style="color: #C5960C;">Verify</span></span>
              </div>
              <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0;">Your Voice, Verified</p>
            </div>

            <div style="padding: 32px;">
              <h2 style="font-size: 22px; font-weight: 700; color: #0B2545; margin: 0 0 12px;">You've been invited! 🎉</h2>
              <p style="font-size: 15px; color: rgba(11,37,69,0.7); line-height: 1.6; margin: 0 0 24px;">
                <strong>${inviterName || 'A fellow citizen'}</strong> thinks your voice matters and invited you to join CivicVerify — the civic platform where every response is identity-verified.
              </p>

              <div style="background: #F5F1EC; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 13px; font-weight: 700; color: #0B2545; margin: 0 0 10px;">Why join CivicVerify?</p>
                <ul style="font-size: 13px; color: rgba(11,37,69,0.65); line-height: 1.8; padding-left: 18px; margin: 0;">
                  <li>Participate in verified civic polls & surveys</li>
                  <li>Debate real issues with real citizens</li>
                  <li>Your opinion reaches policymakers — verified</li>
                  <li>Zero bots. Zero fake accounts.</li>
                </ul>
              </div>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://civicverify.org/signup" style="display: inline-block; background: #0B2545; color: #C5960C; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.3px;">
                  Join CivicVerify →
                </a>
              </div>

              <p style="font-size: 11px; color: rgba(11,37,69,0.3); text-align: center; margin: 0;">
                CivicVerify · Indianapolis, Indiana · <a href="https://civicverify.org" style="color: #C5960C;">civicverify.org</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    var data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Resend error');

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-invite error:', err);
    res.status(500).json({ error: err.message });
  }
}
