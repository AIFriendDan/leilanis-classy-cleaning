// Vercel serverless function — sends a booking notification email to Leilani.
//
// 2026-09-02: written fresh, direct on main. This project never had a working
// notification pipeline in production — the earlier Twilio attempt (commit
// 0a3192c, branch add-time-slot-picker) was never merged to main, and even
// on its own branch it would never have fired: it needed TWILIO_ACCOUNT_SID/
// AUTH_TOKEN/FROM_NUMBER (never set) plus the HCiHY subaccount's toll-free
// number clearing Twilio Trust Hub verification (no ETA, Twilio-side). Same
// blocker StudioLash hit (Linear AIF-63) and resolved the same way: skip
// Twilio, use Resend email instead. Pattern and implementation copied from
// studiolash/api/notify.js (raw fetch to the Resend API, no `resend` npm
// package/build step needed — this repo has never had one).
//
// Called by main.js as a best-effort side channel after Formspree succeeds,
// same as the original Twilio design intended — a notify failure here must
// never block the booking flow. Formspree stays the source of truth for the
// submission itself.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// hcihytech.com is the domain verified in Resend (2026-09-02, same domain
// used for StudioLash). Recipients see the "Leilani's Classy Cleaning
// Booking" display name, not this raw address.
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'bookings@hcihytech.com';

// Leilani's own inbox. Confirmed by Dan 2026-09-02 — same address on file in
// her Twilio account setup (LCC-001 Notion page).
const LEILANI_EMAIL = process.env.LEILANI_NOTIFY_EMAIL || 'classycleaning222@gmail.com';

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Leilani's Classy Cleaning Booking <${RESEND_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured — skipping booking email');
    // 200 + skipped, not 500: this is a best-effort side channel called after
    // Formspree already succeeded, so the booking itself must never fail here.
    res.status(200).json({ ok: false, skipped: true, reason: 'resend_not_configured' });
    return;
  }

  const { name, phone, email, date, timeSlot, service, addons, message } = req.body || {};

  const bodyLines = [
    `New booking request — Leilani's Classy Cleaning`,
    ``,
    `Name: ${name || 'n/a'}`,
    `Phone: ${phone || 'n/a'}`,
    `Email: ${email || 'n/a'}`,
    `Service: ${service || 'n/a'}`,
    `Add-ons: ${addons || 'n/a'}`,
    `Requested date: ${date || 'n/a'}`,
    `Requested time: ${timeSlot || 'n/a'}`,
    `Notes: ${message || 'n/a'}`,
  ];

  try {
    await sendEmail({
      to: LEILANI_EMAIL,
      subject: `New booking request — ${name || 'Unknown'} (${date || 'TBD'})`,
      html: bodyLines.map((line) => `<p>${line}</p>`).join(''),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Leilani booking email failed:', err.message);
    // Still 200: best-effort side channel, Formspree submission already succeeded.
    res.status(200).json({ ok: false, error: 'Failed to send email notification' });
  }
};
