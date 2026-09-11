import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/proAccess';
import { logError } from '@/lib/logger';
import { rateLimit } from '@/lib/rateLimit';

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

    // Aucun quota n'existait sur cet appel à l'API Groq (payante) : un
    // abonnement Pro actif suffisait à l'appeler sans limite de fréquence,
    // ce qui exposait à un usage abusif (script, boucle, credentials
    // partagés) sans contrôle de coût. Limite par compte, sur la même
    // infrastructure distribuée que les autres routes — voir audit RA-04.
    const aiLimit = await rateLimit(`ai-chat:${access.authUser.userId}`, 30, 10 * 60 * 1000);
    if (!aiLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes vers l\'assistant IA. Réessayez dans quelques minutes.' },
        { status: 429 }
      );
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

    // 'llama-3.3-70b-versatile' et 'meta-llama/llama-4-scout-17b-16e-instruct'
    // ont été retirés du catalogue Groq (404 model_not_found, vérifié le
    // 2026-09-11) : c'était la cause réelle du « Ham ne répond pas »,
    // indépendamment de la clé API (valide) ou du quota. Remplacés par les
    // modèles actuellement servis par ce compte Groq (vu via GET
    // /openai/v1/models) : openai/gpt-oss-120b pour le texte, qwen/qwen3.8-27b
    // pour la vision (seuls modèles multimodaux du catalogue — voir
    // https://console.groq.com/docs/vision).
    const model = image ? 'qwen/qwen3.8-27b' : 'openai/gpt-oss-120b';

    const requestBody: Record<string, unknown> = {
      model,
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 2000,
    };
    // Les modèles openai/gpt-oss-* sont des modèles "à raisonnement" : sans
    // ce réglage, une partie du budget max_tokens part dans une chaîne de
    // raisonnement interne (champ `reasoning`, séparé de `content`) et une
    // question un peu longue pouvait épuiser le budget avant toute réponse
    // finale — `content` revenait vide (vérifié empiriquement). 'low' laisse
    // la place à une vraie réponse tout en gardant un minimum de raisonnement.
    if (!image) requestBody.reasoning_effort = 'low';

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logError('Groq error:', err);
      // Groq renvoie 503 quand le modèle est temporairement surchargé côté
      // fournisseur (constaté sur qwen3.8-27b) — un message distinct évite
      // de laisser croire à une panne de l'appli alors qu'un nouvel essai
      // dans quelques secondes suffit généralement.
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'Le service IA est momentanément surchargé côté fournisseur. Réessayez dans quelques instants.' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'Erreur du service IA' }, { status: 502 });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    // Repli défensif : si `content` revient vide malgré reasoning_effort
    // ('low' réduit le risque sans l'éliminer à 100% sur les questions très
    // longues), on préfère montrer le raisonnement au médecin plutôt qu'une
    // bulle vide qui donnerait l'impression que Ham ne répond pas.
    const content = message?.content || message?.reasoning || '';
    if (!content) {
      logError('Groq empty response:', data);
      return NextResponse.json({ error: 'Réponse vide du service IA. Réessayez ou reformulez votre question.' }, { status: 502 });
    }
    return NextResponse.json({ content });
  } catch (error) {
    logError('AI chat error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
