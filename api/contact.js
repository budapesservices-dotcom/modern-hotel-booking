const RESEND_API_URL = "https://api.resend.com/emails";

const json = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const cleanText = (value = "", max = 2000) =>
  String(value).replace(/[\r\n]+/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return json(res, 405, { ok: false, message: "Method not allowed." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    console.error("Missing email configuration.");
    return json(res, 500, { ok: false, message: "Email service is not configured yet." });
  }

  const body = req.body || {};
  if (body.website) return json(res, 200, { ok: true });

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 180);
  const phone = cleanText(body.phone, 80);
  const subject = cleanText(body.subject, 180) || "New guest enquiry";
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return json(res, 400, { ok: false, message: "Please complete your name, email and message." });
  }

  const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailPattern.test(email)) {
    return json(res, 400, { ok: false, message: "Please enter a valid email address." });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "—");
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#292720">',
    '<h2 style="margin:0 0 20px">New Guest Enquiry</h2>',
    '<p style="margin:0 0 24px;color:#716c63">The Still Hotel contact form</p>',
    '<table style="border-collapse:collapse;width:100%;max-width:680px">',
    '<tr><td style="padding:10px 0;color:#8a8175;width:140px">Name</td><td style="padding:10px 0"><strong>' + safeName + '</strong></td></tr>',
    '<tr><td style="padding:10px 0;color:#8a8175">Email</td><td style="padding:10px 0"><a href="mailto:' + safeEmail + '">' + safeEmail + '</a></td></tr>',
    '<tr><td style="padding:10px 0;color:#8a8175">Phone</td><td style="padding:10px 0">' + safePhone + '</td></tr>',
    '<tr><td style="padding:10px 0;color:#8a8175">Subject</td><td style="padding:10px 0">' + safeSubject + '</td></tr>',
    '</table>',
    '<div style="margin-top:26px;padding:22px;background:#f7f4ed;border-left:3px solid #d6b36a">',
    '<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8175;margin-bottom:10px">Message</div>',
    '<div>' + safeMessage + '</div>',
    '</div>',
    '</div>'
  ].join("");

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: "[The Still Hotel] " + subject,
        html
      })
    });

    const result = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error("Resend error:", result);
      return json(res, 502, { ok: false, message: "The message could not be sent right now. Please try again." });
    }

    return json(res, 200, { ok: true, message: "Your message has been sent. We’ll be in touch soon." });
  } catch (error) {
    console.error("Contact mail error:", error);
    return json(res, 500, { ok: false, message: "The message could not be sent right now. Please try again." });
  }
}
