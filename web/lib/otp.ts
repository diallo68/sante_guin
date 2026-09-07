import crypto from 'crypto';

// `Math.random()` n'est pas cryptographiquement sûr : sa sortie est
// prévisible pour qui peut observer suffisamment d'échantillons, ce qui
// affaiblit un code censé être un secret à courte durée de vie —
// voir audit S13. `crypto.randomInt` utilise le générateur sécurisé du
// système.
export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
