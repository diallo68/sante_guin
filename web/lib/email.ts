const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mondocteur.org';
const FROM_NAME = 'Mondocteur';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set — email skipped');
    return false;
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[email] SendGrid error:', err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] fetch error:', e);
    return false;
  }
}

// ── Templates ──────────────────────────────────────────────────

export function emailAppointmentConfirmation(params: {
  patientFirstName: string;
  doctorName: string;
  date: string;
  time: string;
  reason?: string;
}) {
  return {
    subject: `Confirmation de votre rendez-vous — ${params.doctorName}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:22px;">Mondocteur</h1>
    <p style="color:#ccfbf1;margin:4px 0 0;">Votre santé, entre de bonnes mains</p>
  </div>
  <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="color:#1f2937;margin-top:0;">Rendez-vous confirmé ✅</h2>
    <p style="color:#6b7280;">Bonjour <strong>${params.patientFirstName}</strong>,</p>
    <p style="color:#6b7280;">Votre rendez-vous a bien été enregistré :</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#1f2937;"><strong>Médecin :</strong> ${params.doctorName}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Date :</strong> ${params.date}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Heure :</strong> ${params.time}</p>
      ${params.reason ? `<p style="margin:4px 0;color:#1f2937;"><strong>Motif :</strong> ${params.reason}</p>` : ''}
    </div>
    <p style="color:#6b7280;">Vous pouvez suivre votre rendez-vous et échanger des messages avec votre médecin depuis votre espace patient.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://mondocteur.org/profile" style="background:#0d9488;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Voir mon rendez-vous
      </a>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© 2026 Mondocteur — mondocteur.org</p>
</div>`,
  };
}

export function emailNewMessage(params: {
  recipientName: string;
  senderName: string;
  preview: string;
  conversationId: string;
  role: 'patient' | 'doctor';
}) {
  const link = params.role === 'doctor'
    ? `https://mondocteur.org/pro/messages?conv=${params.conversationId}`
    : `https://mondocteur.org/messages?conv=${params.conversationId}`;

  return {
    subject: `Nouveau message de ${params.senderName}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:22px;">Mondocteur</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="color:#1f2937;margin-top:0;">Nouveau message 💬</h2>
    <p style="color:#6b7280;">Bonjour <strong>${params.recipientName}</strong>,</p>
    <p style="color:#6b7280;"><strong>${params.senderName}</strong> vous a envoyé un message :</p>
    <div style="background:#f3f4f6;border-left:4px solid #0d9488;padding:12px 16px;border-radius:4px;margin:16px 0;color:#374151;font-style:italic;">
      "${params.preview.length > 200 ? params.preview.slice(0, 200) + '…' : params.preview}"
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${link}" style="background:#0d9488;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Répondre au message
      </a>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© 2026 Mondocteur — mondocteur.org</p>
</div>`,
  };
}

export function emailAppointmentStatusChange(params: {
  patientFirstName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
}) {
  const isConfirmed = params.status === 'confirmed';
  return {
    subject: isConfirmed
      ? `Votre rendez-vous a été confirmé — ${params.doctorName}`
      : `Votre rendez-vous a été annulé — ${params.doctorName}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:22px;">Mondocteur</h1>
  </div>
  <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="color:#1f2937;margin-top:0;">
      ${isConfirmed ? 'Rendez-vous confirmé ✅' : 'Rendez-vous annulé ❌'}
    </h2>
    <p style="color:#6b7280;">Bonjour <strong>${params.patientFirstName}</strong>,</p>
    <p style="color:#6b7280;">
      ${isConfirmed
        ? `Le Dr. <strong>${params.doctorName}</strong> a confirmé votre rendez-vous.`
        : `Le Dr. <strong>${params.doctorName}</strong> a annulé votre rendez-vous. Vous pouvez en prendre un nouveau depuis la plateforme.`}
    </p>
    <div style="background:${isConfirmed ? '#f0fdfa' : '#fef2f2'};border:1px solid ${isConfirmed ? '#99f6e4' : '#fecaca'};border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#1f2937;"><strong>Médecin :</strong> ${params.doctorName}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Date :</strong> ${params.date}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Heure :</strong> ${params.time}</p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://mondocteur.org/profile" style="background:#0d9488;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        ${isConfirmed ? 'Voir mon rendez-vous' : 'Prendre un nouveau rendez-vous'}
      </a>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© 2026 Mondocteur — mondocteur.org</p>
</div>`,
  };
}
