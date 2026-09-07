import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SubscriptionRequest from '@/models/SubscriptionRequest';
import { sendEmail } from '@/lib/mailer';
import { escapeHtml } from '@/lib/htmlEscape';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Limite le spam de demandes et d'emails admin — voir audit S13.
    const limit = rateLimit(`subscribe:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await req.json();
    const { nom, telephone, email, localisation, planName, message } = body;

    if (!nom || !telephone || !planName) {
      return NextResponse.json({ error: 'Nom, téléphone et offre sont requis' }, { status: 400 });
    }

    await connectDB();

    const request = await SubscriptionRequest.create({
      nom, telephone, email, localisation, planName, message,
    });

    // Notification email à l'admin. Chaque champ fourni par l'utilisateur
    // est échappé avant interpolation dans le HTML — non échappé, un nom
    // ou un message contenant des balises pouvait falsifier le contenu de
    // l'email reçu par l'administration — voir audit S19.
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Mondocteur Pro] Nouvelle demande — Offre ${escapeHtml(planName)}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
            <div style="background:#0d9488;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:20px">Mondocteur — Nouvelle demande Pro</h1>
            </div>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:130px">Offre</td><td style="padding:8px 0;font-weight:700;color:#0d9488">${escapeHtml(planName)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Nom</td><td style="padding:8px 0;font-weight:600;color:#111827">${escapeHtml(nom)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Téléphone</td><td style="padding:8px 0;color:#111827">${escapeHtml(telephone)}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0;color:#111827">${email ? escapeHtml(email) : '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Localisation</td><td style="padding:8px 0;color:#111827">${localisation ? escapeHtml(localisation) : '—'}</td></tr>
            </table>
            <div style="background:#fff;border-radius:10px;padding:16px;margin-top:16px;border-left:4px solid #0d9488">
              <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em">Message</p>
              <p style="color:#374151;font-size:14px;margin:0;line-height:1.6">${message ? escapeHtml(message) : '—'}</p>
            </div>
            <div style="margin-top:24px;text-align:center">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/demandes-pro" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none">
                Voir dans le dashboard Admin
              </a>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, id: request._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
