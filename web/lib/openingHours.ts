// Détermine si un établissement (pharmacie, laboratoire) est actuellement
// ouvert, à partir de ses horaires déclarés.
//
// Deux bugs corrigés ici — voir audit B27 :
// - L'heure locale du navigateur du visiteur était utilisée telle quelle
//   (`new Date().getHours()`), ce qui donne un résultat faux pour un
//   établissement en Guinée consulté depuis un autre fuseau horaire.
//   L'heure est maintenant lue explicitement en fuseau Africa/Conakry.
// - Un horaire traversant minuit (ex. ouverture 20h, fermeture 2h) rendait
//   la condition `current >= open && current < close` toujours fausse,
//   affichant l'établissement comme fermé en permanence.
export function isCurrentlyOpen(openTime?: string, closeTime?: string, isOpen24h?: boolean): boolean {
  if (isOpen24h) return true;
  if (!openTime || !closeTime) return false;

  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  if ([oh, om, ch, cm].some(Number.isNaN)) return false;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Conakry',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const nowHour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const nowMinute = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  const current = nowHour * 60 + nowMinute;

  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;

  if (closeMinutes <= openMinutes) {
    // Plage traversant minuit (ex. 20:00 → 02:00).
    return current >= openMinutes || current < closeMinutes;
  }
  return current >= openMinutes && current < closeMinutes;
}
