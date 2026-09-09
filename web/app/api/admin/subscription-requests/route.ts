import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import SubscriptionRequest from '@/models/SubscriptionRequest';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import { sendEmail } from '@/lib/mailer';
import { logError } from '@/lib/logger';

// Durée d'abonnement selon le plan
function getExpiryDate(planName: string): Date {
  const now = new Date();
  if (planName === 'Excellence') return new Date(now.setFullYear(now.getFullYear() + 1));
  if (planName === 'Confort') return new Date(now.setMonth(now.getMonth() + 3));
  return new Date(now.setMonth(now.getMonth() + 1)); // Essentiel
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const filter = status && status !== 'all' ? { status } : {};
  const requests = await SubscriptionRequest.find(filter).sort({ createdAt: -1 });

  return NextResponse.json({ requests });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAuthUser(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id, status, adminNote, sendMessageOnly } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  await connectDB();

  const previous = await SubscriptionRequest.findById(id);
  if (!previous) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

  // ── Envoyer un message sans décision ──
  if (sendMessageOnly) {
    if (adminNote !== undefined) {
      await SubscriptionRequest.findByIdAndUpdate(id, { adminNote });
    }
    if (previous.email && adminNote?.trim()) {
      const firstName = previous.nom.split(' ')[0];
      await sendEmail({
        to: previous.email,
        subject: `Message de l'équipe Mondocteur — Offre ${previous.planName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
            <div style="background:#0d9488;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:20px">Mondocteur</h1>
            </div>
            <h2 style="color:#111827;font-size:18px;margin-bottom:8px">Bonjour ${firstName},</h2>
            <p style="color:#6b7280;font-size:13px;margin-bottom:8px">Concernant votre demande d'abonnement <strong style="color:#0d9488">Offre ${previous.planName}</strong> :</p>
            <div style="background:#fff;border-left:4px solid #0d9488;padding:16px;border-radius:0 10px 10px 0;margin-bottom:20px">
              <p style="color:#374151;font-size:14px;margin:0;line-height:1.7">${adminNote}</p>
            </div>
            <p style="color:#6b7280;font-size:13px">Pour toute question : <strong>+224 620 000 000</strong> (Lun–Sam 8h–18h)</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Mondocteur</p>
          </div>
        `,
      });
    }
    return NextResponse.json({ success: true });
  }

  const update: any = {};
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  const statusChanged = status && status !== previous.status;

  // ── Activation : mettre à jour le profil Pro en DB ──
  // Tentée à chaque appel avec status === 'active', pas seulement quand le
  // statut change : marquer la demande "active" AVANT de savoir si le
  // profil a bien été mis à jour laissait un nouvel essai sans effet après
  // un premier échec, puisque `statusChanged` devenait alors faux —
  // voir audit B20. On échoue maintenant explicitement plutôt que de
  // répondre un succès silencieux.
  if (status === 'active') {
    const query: any[] = [];
    if (previous.email) query.push({ email: previous.email });
    if (previous.telephone) query.push({ phone: previous.telephone });

    const targetUser = query.length > 0 ? await User.findOne({ $or: query }) : null;
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Aucun compte utilisateur ne correspond à cet email/téléphone.' },
        { status: 409 }
      );
    }

    const expiresAt = getExpiryDate(previous.planName);
    const profileUpdate = {
      subscriptionStatus: 'active',
      subscriptionPlan: previous.planName,
      subscriptionExpiresAt: expiresAt,
    };

    let profileDoc = null;
    if (targetUser.role === 'doctor') {
      profileDoc = await Doctor.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
    } else if (targetUser.role === 'pharmacist') {
      profileDoc = await Pharmacy.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
    } else if (targetUser.role === 'laboratorist') {
      profileDoc = await Laboratory.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
    }

    if (!profileDoc) {
      return NextResponse.json(
        { error: 'Profil professionnel introuvable pour ce compte.' },
        { status: 409 }
      );
    }
  }

  const updated = await SubscriptionRequest.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

  // ── Résiliation : désactiver le profil ──
  if (statusChanged && status === 'rejected') {
    try {
      const query: any[] = [];
      if (updated.email) query.push({ email: updated.email });
      if (updated.telephone) query.push({ phone: updated.telephone });

      const targetUser = query.length > 0
        ? await User.findOne({ $or: query })
        : null;

      if (targetUser) {
        const profileUpdate = { subscriptionStatus: 'none' };
        if (targetUser.role === 'doctor') {
          await Doctor.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
        } else if (targetUser.role === 'pharmacist') {
          await Pharmacy.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
        } else if (targetUser.role === 'laboratorist') {
          await Laboratory.findOneAndUpdate({ userId: targetUser._id }, profileUpdate);
        }
      }
    } catch (e) {
      logError('Erreur désactivation profil Pro:', e);
    }
  }

  // ── Email à l'utilisateur ──
  if (statusChanged && updated.email && (status === 'active' || status === 'rejected')) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mondocteur.org';
    const firstName = updated.nom.split(' ')[0];

    if (status === 'active') {
      await sendEmail({
        to: updated.email,
        subject: `✅ Votre abonnement Mondocteur Pro ${updated.planName} est activé !`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
            <div style="background:#0d9488;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:22px">Mondocteur Pro</h1>
              <p style="color:#99f6e4;margin:6px 0 0">Votre santé, entre de bonnes mains</p>
            </div>
            <h2 style="color:#111827;font-size:20px;margin-bottom:8px">Félicitations ${firstName} ! 🎉</h2>
            <p style="color:#4b5563;line-height:1.7;margin-bottom:20px">
              Votre abonnement <strong style="color:#0d9488">Mondocteur Pro — Offre ${updated.planName}</strong> a été validé et activé par notre équipe.
            </p>
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="color:#0d9488;font-weight:700;font-size:15px;margin:0 0 12px">Vous avez maintenant accès à :</p>
              <ul style="color:#374151;font-size:14px;line-height:2;margin:0;padding-left:20px">
                <li>Tableau de bord Pro complet</li>
                <li>Gestion des rendez-vous et patients</li>
                <li>Ham — Votre assistant IA médical</li>
                <li>Dossiers patients numériques</li>
                <li>Statistiques et rapports</li>
              </ul>
            </div>
            ${adminNote ? `<div style="background:#fff;border-left:4px solid #0d9488;padding:14px 16px;border-radius:0 10px 10px 0;margin-bottom:20px"><p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em">Message de l'équipe</p><p style="color:#374151;font-size:14px;margin:0;line-height:1.6">${adminNote}</p></div>` : ''}
            <div style="text-align:center;margin-top:28px">
              <a href="${appUrl}/pro" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Accéder à mon espace Pro →</a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
            <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Mondocteur · Ne pas répondre à cet email</p>
          </div>
        `,
      });
    }

    if (status === 'rejected') {
      await sendEmail({
        to: updated.email,
        subject: `Votre demande d'abonnement Mondocteur Pro`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px">
            <div style="background:#0d9488;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:#fff;margin:0;font-size:22px">Mondocteur</h1>
              <p style="color:#99f6e4;margin:6px 0 0">Votre santé, entre de bonnes mains</p>
            </div>
            <h2 style="color:#111827;font-size:18px;margin-bottom:8px">Bonjour ${firstName},</h2>
            <p style="color:#4b5563;line-height:1.7;margin-bottom:16px">
              Nous avons bien reçu votre demande d'abonnement <strong>Mondocteur Pro — Offre ${updated.planName}</strong>. Malheureusement, nous ne sommes pas en mesure de la traiter pour le moment.
            </p>
            ${adminNote ? `<div style="background:#fff;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:0 10px 10px 0;margin-bottom:20px"><p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em">Motif</p><p style="color:#374151;font-size:14px;margin:0;line-height:1.6">${adminNote}</p></div>` : ''}
            <p style="color:#4b5563;line-height:1.7">N'hésitez pas à nous contacter au <strong>+224 620 000 000</strong> (Lun–Sam 8h–18h).</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
            <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Mondocteur · Ne pas répondre à cet email</p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ request: updated });
}
