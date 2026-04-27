import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Email non configuré — silencieux en dev
    console.log(`[Email skipped] Confirmation RDV pour ${patientEmail}`);
    return;
  }

  const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  await transporter.sendMail({
    from: `"Guinée Santé" <${process.env.SMTP_USER}>`,
    to: patientEmail,
    subject: `Confirmation de votre rendez-vous — ${doctorName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
        <div style="background:#0d9488;borderRadius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px">Guinée Santé</h1>
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
          En cas de besoin, connectez-vous à votre compte sur
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#0d9488">Guinée Santé</a>
          pour gérer vos rendez-vous.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px;text-align:center">
          © 2026 Guinée Santé · Ne pas répondre à cet email
        </p>
      </div>
    `,
  });
}
