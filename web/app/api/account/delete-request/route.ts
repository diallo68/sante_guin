import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const adminEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@mondocteur.org';

  await sendEmail({
    to: adminEmail,
    subject: `Demande de suppression de compte — ${email}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:22px;">Mondocteur</h1>
    <p style="color:#ccfbf1;margin:4px 0 0;">Demande de suppression de compte</p>
  </div>
  <div style="background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="color:#dc2626;margin-top:0;">Suppression demandée</h2>
    <p style="color:#6b7280;">Un utilisateur a soumis une demande de suppression de son compte :</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#1f2937;"><strong>Nom :</strong> ${name}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Email :</strong> ${email}</p>
      <p style="margin:4px 0;color:#6b7280;font-size:13px;">Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Conakry' })}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;">Veuillez traiter cette demande dans les 30 jours conformément à la politique de confidentialité.</p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© 2026 Mondocteur — mondocteur.org</p>
</div>`,
  });

  return NextResponse.json({ ok: true });
}
