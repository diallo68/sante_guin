// Échappe une valeur fournie par l'utilisateur avant de l'interpoler dans
// un template email HTML. Sans ça, un nom ou un message contenant des
// balises pouvait falsifier le contenu d'un email envoyé au nom de la
// plateforme (liens de phishing, mise en forme trompeuse) — voir audit S19.
// Il s'agit d'une injection HTML dans le corps de l'email, pas d'une
// exécution JavaScript dans le client mail.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
