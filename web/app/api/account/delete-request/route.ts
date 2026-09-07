import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { escapeHtml } from '@/lib/htmlEscape';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import DeletionRequest from '@/models/DeletionRequest';

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Limite le spam d'emails vers l'administration — voir audit S13.
  const limit = rateLimit(`delete-request:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
  }

  await connectDB();

  // Toujours persisté, indépendamment du succès de l'email : sans ça,
  // l'absence de SendGrid (ou un envoi en échec) faisait perdre la
  // demande silencieusement tout en répondant un succès — voir audit B19.
  const request = await DeletionRequest.create({ name, email, emailSent: false });

  const adminEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@mondocteur.org';

  // `name`/`email` sont échappés avant interpolation : non échappés, un
  // nom contenant des balises pouvait falsifier le contenu de l'email
  // reçu par l'administration (liens de phishing, mise en forme
  // trompeuse) — voir audit S19. Cette route ne fait qu'envoyer une
  // notification : aucune suppression n'est déclenchée automatiquement,
  // et l'identité du demandeur n'est pas vérifiée ici — un traitement
  // manuel ne doit jamais se fier à cet email seul.
  const sent = await sendEmail({
    to: adminEmail,
    subject: `Demande de suppression de compte — ${escapeHtml(email)}`,
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
      <p style="margin:4px 0;color:#1f2937;"><strong>Nom :</strong> ${escapeHtml(name)}</p>
      <p style="margin:4px 0;color:#1f2937;"><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p style="margin:4px 0;color:#6b7280;font-size:13px;">Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Conakry' })}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;">Veuillez traiter cette demande dans les 30 jours conformément à la politique de confidentialité.</p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© 2026 Mondocteur — mondocteur.org</p>
</div>`,
  }).catch(() => false);

  if (sent) {
    request.emailSent = true;
    await request.save();
  }

  return NextResponse.json({ ok: true });
}
