import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es un assistant médical professionnel conçu pour aider les médecins, pharmaciens et laboratoristes en Guinée.

Tes capacités :
- Aide au diagnostic différentiel (symptômes, examens à prescrire)
- Informations sur les médicaments (dosages, interactions, contre-indications)
- Rédaction d'ordonnances et comptes rendus médicaux
- Interprétation de résultats biologiques
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
    const authUser = await getAuthUser(req);
    if (!authUser || !['doctor', 'pharmacist', 'laboratorist'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Service IA non configuré' }, { status: 500 });
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-20), // garder les 20 derniers messages max
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'Erreur du service IA' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
