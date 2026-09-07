// Détection du type réel d'un fichier par signature binaire (magic bytes),
// plutôt que par le champ `type` déclaré par le client (falsifiable) ou
// l'extension de son nom de fichier. Utilisé pour rejeter les contenus
// actifs (HTML/SVG déguisés en image) uploadés sur des routes qui servent
// ensuite ces fichiers.

export type DetectedKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'pdf';

const SIGNATURES: { kind: DetectedKind; check: (b: Buffer) => boolean }[] = [
  { kind: 'jpeg', check: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    kind: 'png',
    check: b =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    kind: 'gif',
    check: b =>
      b.length >= 6 &&
      (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a'),
  },
  {
    kind: 'webp',
    check: b =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
  {
    kind: 'pdf',
    check: b => b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-',
  },
];

/** Renvoie le type réel du fichier d'après ses premiers octets, ou null si non reconnu. */
export function detectFileKind(buffer: Buffer): DetectedKind | null {
  for (const sig of SIGNATURES) {
    if (sig.check(buffer)) return sig.kind;
  }
  return null;
}

const EXTENSION_BY_KIND: Record<DetectedKind, string> = {
  jpeg: 'jpg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  pdf: 'pdf',
};

const MIME_BY_KIND: Record<DetectedKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export function safeExtensionFor(kind: DetectedKind): string {
  return EXTENSION_BY_KIND[kind];
}

export function mimeTypeFor(kind: DetectedKind): string {
  return MIME_BY_KIND[kind];
}

export const IMAGE_KINDS: DetectedKind[] = ['jpeg', 'png', 'gif', 'webp'];
export const DOCUMENT_KINDS: DetectedKind[] = ['jpeg', 'png', 'gif', 'webp', 'pdf'];
