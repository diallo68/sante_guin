// Mailer — SendGrid HTTP API (port 443, jamais bloqué par Render)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@mondocteur.org';

  if (!apiKey) {
    console.warn(`[SendGrid skipped — SENDGRID_API_KEY manquant] To: ${to}`);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: 'Mondocteur' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
}

export async function sendOTPEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name: string;
  otp: string;
}) {
  await sendEmail({
    to,
    subject: `Votre code de vérification — Mondocteur`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
        <div style="background:#0d9488;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px">Mondocteur</h1>
          <p style="color:#99f6e4;margin:6px 0 0">Votre santé, entre de bonnes mains</p>
        </div>
        <h2 style="color:#111827;font-size:18px;margin-bottom:8px">Bonjour ${name},</h2>
        <p style="color:#4b5563;line-height:1.6">
          Voici votre code de vérification pour finaliser votre inscription :
        </p>
        <div style="text-align:center;margin:28px 0">
          <span style="display:inline-block;background:#f0fdfa;border:2px solid #0d9488;border-radius:12px;padding:16px 32px;font-size:36px;font-weight:900;letter-spacing:12px;color:#0d9488">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Mondocteur · Ne pas répondre à cet email</p>
      </div>
    `,
  });
}

export async function sendAppointmentConfirmation({
  patientEmail,
  patientName,
  doctorName,
  date,
  time,
}: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}) {
  const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  await sendEmail({
    to: patientEmail,
    subject: `Confirmation de votre rendez-vous — ${doctorName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
        <div style="background:#0d9488;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px">Mondocteur</h1>
          <p style="color:#99f6e4;margin:6px 0 0">Votre santé, entre de bonnes mains</p>
        </div>
        <h2 style="color:#111827;font-size:18px;margin-bottom:8px">Bonjour ${patientName},</h2>
        <p style="color:#4b5563;line-height:1.6">
          Votre demande de rendez-vous a bien été enregistrée. Le médecin vous confirmera prochainement.
        </p>
        <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #0d9488">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.05em">Détails du rendez-vous</p>
          <p style="margin:4px 0;font-size:16px;font-weight:700;color:#111827">${doctorName}</p>
          <p style="margin:4px 0;color:#374151">📅 ${dateFormatted}</p>
          <p style="margin:4px 0;color:#374151">🕐 ${time}</p>
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          Connectez-vous à votre compte sur
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#0d9488">Mondocteur</a>
          pour gérer vos rendez-vous.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Mondocteur · Ne pas répondre à cet email</p>
      </div>
    `,
  });
}
