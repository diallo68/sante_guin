import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/proAccess';
import { logError } from '@/lib/logger';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es un assistant médical professionnel conçu pour aider les médecins, pharmaciens et laboratoristes en Guinée.

Tes capacités :
- Aide au diagnostic différentiel (symptômes, examens à prescrire)
- Informations sur les médicaments (dosages, interactions, contre-indications)
- Rédaction d'ordonnances et comptes rendus médicaux
- Interprétation de résultats biologiques et d'examens
- Analyse d'ordonnances médicales (images)
- Protocoles de traitement selon les guidelines internationales adaptées au contexte guinéen
- Rappel des maladies tropicales fréquentes (paludisme, typhoïde, hépatites, VIH, tuberculose, etc.)

Règles importantes :
- Tu t'adresses uniquement à des professionnels de santé qualifiés
- Tes réponses sont des aides à la décision, jamais un diagnostic final
- Rappelle toujours que la décision clinique appartient au médecin
- Réponds en français, de façon claire et structurée
- Prends en compte le contexte africain/guinéen (ressources disponibles, maladies endémiques)
- Pour les médicaments, privilégie ceux disponibles en Afrique de l'Ouest`;

export async function POST(req: NextRequest) {
  try {
    // Même contrôle que /api/pro/access (rôle + abonnement actif) : sans ça,
    // un compte professionnel non abonné pouvait utiliser l'IA gratuitement
    // en appelant l'API directement — voir audit S10.
    const access = await requireActiveSubscription(req);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const { messages, image, imagePrompt } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
    }

    // Les rôles et contenus fournis par le client n'étaient pas validés :
    // un message `{ role: 'system', ... }` pouvait écraser ou compléter le
    // prompt système, et aucune limite de taille n'existait — voir audit
    // S20. Seuls 'user'/'assistant' sont acceptés ; le rôle système reste
    // fixé par le serveur.
    const MAX_CONTENT_LENGTH = 8000;
    const sanitizedMessages = messages.slice(-20).filter(
      (m: unknown): m is { role: 'user' | 'assistant'; content: string } =>
        !!m && typeof m === 'object' &&
        ((m as any).role === 'user' || (m as any).role === 'assistant') &&
        typeof (m as any).content === 'string' &&
        (m as any).content.length > 0 &&
        (m as any).content.length <= MAX_CONTENT_LENGTH
    );

    if (sanitizedMessages.length === 0) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
    }

    if (image && (typeof image !== 'string' || image.length > 8_000_000)) {
      return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
    }
    if (imagePrompt && (typeof imagePrompt !== 'string' || imagePrompt.length > MAX_CONTENT_LENGTH)) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Service IA non configuré' }, { status: 500 });
    }

    let groqMessages;

    if (image) {
      // Mode vision : image + texte → modèle vision
      groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: image },
            },
            {
              type: 'text',
              text: imagePrompt || 'Analyse et interprète ce document médical. Fournis une interprétation clinique détaillée en français.',
            },
          ],
        },
      ];
    } else {
      // Mode texte : conversation normale
      groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...sanitizedMessages,
      ];
    }

    const model = image ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logError('Groq error:', err);
      return NextResponse.json({ error: 'Erreur du service IA' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content });
  } catch (error) {
    logError('AI chat error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
