// Client bas niveau pour l'envoi d'emails transactionnels via Brevo
// (ex-Sendinblue), remplace SendGrid — voir README pour le contexte de la
// migration (compte SendGrid abandonné avec le passage de Render à Oracle
// Cloud). Point d'entrée unique utilisé par lib/email.ts et lib/mailer.ts,
// qui dupliquaient auparavant chacun leur propre appel HTTP à SendGrid
// avec des conventions d'erreur différentes (voir audit123.md section 4).
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendViaBrevo({ to, subject, html, fromName = 'Mondocteur' }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@mondocteur.org';

  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY manquant' };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return { ok: false, error: `Brevo error ${res.status}: ${err}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Brevo fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }
}
