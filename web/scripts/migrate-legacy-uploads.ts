// Migration RA-05 (audit123_A_nouveau.md) : déplace les anciens documents
// patients / pièces jointes de conversation encore stockés sous
// `public/uploads/{patients,conversations}/` (accessibles publiquement,
// sans authentification, car servis statiquement par Next.js) vers le
// répertoire privé `private-uploads/{patients,conversations}/`, et
// renseigne `storedFilename` en base pour que les routes de téléchargement
// n'aient plus besoin de leur repli `LEGACY_PUBLIC_DIR`.
//
// Idempotent : un document déjà migré (storedFilename déjà renseigné) est
// ignoré. Un fichier source manquant est signalé mais n'interrompt pas le
// reste de la migration.
//
// Usage (depuis web/, avec MONGODB_URI positionné dans l'environnement) :
//   npx tsx scripts/migrate-legacy-uploads.ts           # à blanc (dry-run)
//   npx tsx scripts/migrate-legacy-uploads.ts --apply   # applique réellement
//
// À exécuter là où vivent les fichiers (le serveur de production), pas en
// local où `public/uploads/` est vide.

import path from 'path';
import { randomUUID } from 'crypto';
import { access, copyFile, mkdir, unlink } from 'fs/promises';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import PatientRecord from '../models/PatientRecord';
import Message from '../models/Message';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Ne pas importer lib/db.ts ici : il lit MONGODB_URI dès son import (avant
// que dotenv.config() ci-dessus n'ait pu s'exécuter, les imports statiques
// étant hissés en tête de fichier) et lèverait donc systématiquement,
// comme dans scripts/seed.ts. On se connecte directement.
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant dans .env.local');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

const PUBLIC_PATIENTS_DIR = path.join(process.cwd(), 'public', 'uploads', 'patients');
const PUBLIC_CONVERSATIONS_DIR = path.join(process.cwd(), 'public', 'uploads', 'conversations');
const PRIVATE_PATIENTS_DIR = path.join(process.cwd(), 'private-uploads', 'patients');
const PRIVATE_CONVERSATIONS_DIR = path.join(process.cwd(), 'private-uploads', 'conversations');

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function newStoredFilename(originalUrl: string): string {
  const ext = path.extname(originalUrl) || '';
  return `${randomUUID()}${ext}`;
}

async function migrateOne(
  publicDir: string,
  privateDir: string,
  originalUrl: string,
  label: string
): Promise<string | null> {
  const sourceName = path.basename(originalUrl);
  const sourcePath = path.join(publicDir, sourceName);

  if (!(await fileExists(sourcePath))) {
    console.warn(`  [manquant] ${label} : ${sourcePath} introuvable, ignoré`);
    return null;
  }

  const storedFilename = newStoredFilename(originalUrl);
  const destPath = path.join(privateDir, storedFilename);

  if (!APPLY) {
    console.log(`  [dry-run] ${label} : ${sourcePath} -> ${destPath}`);
    return storedFilename;
  }

  await mkdir(privateDir, { recursive: true });
  // Copie puis suppression plutôt qu'un rename atomique : public/ et
  // private-uploads/ peuvent être sur des points de montage différents.
  await copyFile(sourcePath, destPath);
  await unlink(sourcePath).catch(() => {
    // Le fichier source reste en place si la suppression échoue (droits) ;
    // ce n'est pas bloquant, l'important est que le fichier privé existe et
    // que la route de téléchargement ne dépende plus du public pour ce doc.
  });
  console.log(`  [migré]   ${label} : ${sourcePath} -> ${destPath}`);
  return storedFilename;
}

async function migratePatientDocuments() {
  const records = await PatientRecord.find({ 'documents.storedFilename': { $exists: false } });
  let migrated = 0;

  for (const record of records) {
    let changed = false;
    for (const doc of record.documents) {
      if (doc.storedFilename) continue;
      const storedFilename = await migrateOne(
        PUBLIC_PATIENTS_DIR,
        PRIVATE_PATIENTS_DIR,
        doc.url,
        `patient ${record._id} / document ${doc._id}`
      );
      if (storedFilename) {
        doc.storedFilename = storedFilename;
        changed = true;
        migrated += 1;
      }
    }
    if (changed && APPLY) await record.save();
  }

  console.log(`PatientRecord.documents : ${migrated} document(s) migré(s) (dry-run: ${!APPLY}).`);
}

async function migrateConversationAttachments() {
  const messages = await Message.find({ 'attachments.storedFilename': { $exists: false }, 'attachments.0': { $exists: true } });
  let migrated = 0;

  for (const message of messages) {
    let changed = false;
    for (const attachment of message.attachments) {
      if (attachment.storedFilename) continue;
      const storedFilename = await migrateOne(
        PUBLIC_CONVERSATIONS_DIR,
        PRIVATE_CONVERSATIONS_DIR,
        attachment.url,
        `message ${message._id} / pièce jointe`
      );
      if (storedFilename) {
        attachment.storedFilename = storedFilename;
        changed = true;
        migrated += 1;
      }
    }
    if (changed && APPLY) await message.save();
  }

  console.log(`Message.attachments : ${migrated} pièce(s) jointe(s) migrée(s) (dry-run: ${!APPLY}).`);
}

async function main() {
  console.log(`Migration RA-05 — mode ${APPLY ? 'APPLICATION' : 'DRY-RUN (aucune écriture)'}`);
  await mongoose.connect(MONGODB_URI!);
  await migratePatientDocuments();
  await migrateConversationAttachments();
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Migration échouée :', err);
  process.exit(1);
});
