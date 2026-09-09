// Journalisation avec masquage des données personnelles — voir audit
// RA-06. `console.error('X:', error)` un peu partout journalisait l'erreur
// brute : un message de Mongoose (`duplicate key ... { email: "..." }`),
// une erreur renvoyée par l'API Brevo qui peut citer le destinataire
// (`lib/emailProvider.ts`), ou toute autre exception embarquant un email
// finissait ainsi en clair dans les logs de production.
//
// Ce n'est pas une garantie absolue (un champ personnel qui ne ressemble
// pas à un email — nom, téléphone — pourrait encore fuiter dans une
// erreur suffisamment inhabituelle), mais couvre le cas concret signalé :
// l'email, seule donnée personnelle qui apparaît de façon prévisible dans
// ces messages d'erreur.
const EMAIL_RE = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;

function redactString(text: string): string {
  return text.replace(EMAIL_RE, '[email masqué]');
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value instanceof Error) {
    const clone = new Error(redactString(value.message));
    clone.name = value.name;
    if (value.stack) clone.stack = redactString(value.stack);
    return clone;
  }
  return value;
}

export function logError(label: string, error: unknown): void {
  console.error(label, redact(error));
}

export function logWarn(label: string, detail?: unknown): void {
  if (detail === undefined) {
    console.warn(redactString(label));
    return;
  }
  console.warn(label, redact(detail));
}
