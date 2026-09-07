import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant dans .env.local');
  process.exit(1);
}

// Ce script insère des données de démonstration et ne doit jamais toucher
// une base réelle — voir audit S14. Deux garde-fous indépendants, aucun
// n'étant infaillible seul (mauvais .env.local, NODE_ENV non défini en
// local) :
// 1. Refus si NODE_ENV=production.
// 2. L'opérateur doit confirmer explicitement le nom de la base ciblée.
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed refusé : NODE_ENV=production.');
  process.exit(1);
}

const dbName = MONGODB_URI.match(/\/([^/?]+)(\?|$)/)?.[1] || '';
if (!process.env.SEED_CONFIRM_DB || process.env.SEED_CONFIRM_DB !== dbName) {
  console.error(
    `❌ Seed refusé : définissez SEED_CONFIRM_DB="${dbName}" pour confirmer explicitement que c'est bien la base de test visée.`
  );
  process.exit(1);
}

// ---- Schémas inline pour le seed ----

const UserSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  email: { type: String, sparse: true, lowercase: true },
  phone: { type: String, sparse: true },
  passwordHash: String,
  role: { type: String, default: 'patient' },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  firstName: String, lastName: String,
  specialty: String, phone: String, email: String,
  city: String, address: String, bio: String, photo: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  consultationFee: Number,
  languages: [String],
}, { timestamps: true });

const PharmacySchema = new mongoose.Schema({
  name: String, phone: String, email: String,
  city: String, address: String, photo: String,
  isOpen24h: { type: Boolean, default: false },
  openTime: String, closeTime: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

const LaboratorySchema = new mongoose.Schema({
  name: String, phone: String, email: String,
  city: String, address: String, photo: String,
  analyses: [String],
  isOpen24h: { type: Boolean, default: false },
  openTime: String, closeTime: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
  const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', PharmacySchema);
  const Laboratory = mongoose.models.Laboratory || mongoose.model('Laboratory', LaboratorySchema);

  // Chaque enregistrement est upserté par sa clé métier plutôt qu'un
  // deleteMany() global suivi d'un insertMany() : une exécution répétée ne
  // détruit plus les données créées entre deux exécutions (rendez-vous,
  // avis, modifications manuelles de test) — seed idempotent, voir audit S14.
  let doctorUser = await User.findOne({ email: 'docteur@guineesante.gn' });
  if (!doctorUser) {
    // Mot de passe aléatoire à chaque exécution : jamais de valeur fixe
    // journalisée dans le code source — voir audit S14.
    const generatedPassword = crypto.randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(generatedPassword, 12);
    doctorUser = await User.create({
      firstName: 'Ahmed', lastName: 'Diallo',
      email: 'docteur@guineesante.gn',
      passwordHash, role: 'doctor', isVerified: true,
    });
    console.log(`👨‍⚕️  Compte médecin créé : docteur@guineesante.gn / ${generatedPassword}`);
    console.log('   (mot de passe généré aléatoirement, non stocké ailleurs — notez-le maintenant)');
  }

  // ---- Médecins ----
  const doctors = [
    {
      userId: doctorUser._id,
      firstName: 'Ahmed', lastName: 'Diallo',
      specialty: 'Cardiologue',
      phone: '+224 622 123 456',
      email: 'ahmed.diallo@guineesante.gn',
      city: 'Conakry', address: 'Quartier Kindia, Commune de Kaloum',
      bio: 'Cardiologue avec 12 ans d\'expérience, spécialisé dans le diagnostic et traitement des maladies cardiovasculaires.',
      rating: 4.8, reviewCount: 127,
      consultationFee: 150000,
      languages: ['Français', 'Anglais'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Fatou', lastName: 'Sow',
      specialty: 'Médecin généraliste',
      phone: '+224 622 234 567',
      email: 'fatou.sow@guineesante.gn',
      city: 'Conakry', address: 'Plateau, Avenue de la République',
      bio: 'Médecin généraliste avec 8 ans d\'expérience. Prise en charge globale des patients adultes et enfants.',
      rating: 4.6, reviewCount: 89,
      consultationFee: 100000,
      languages: ['Français', 'Pular'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Mamadou', lastName: 'Bah',
      specialty: 'Dermatologue',
      phone: '+224 622 345 678',
      email: 'mamadou.bah@guineesante.gn',
      city: 'Conakry', address: 'Dixinn, Rue KA-020',
      bio: 'Dermatologue avec 15 ans d\'expérience. Traitement des maladies de la peau, cheveux et ongles.',
      rating: 4.7, reviewCount: 156,
      consultationFee: 120000,
      languages: ['Français', 'Anglais', 'Arabe'],
      isAvailable: false, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Aïssatou', lastName: 'Diop',
      specialty: 'Pédiatre',
      phone: '+224 622 456 789',
      email: 'aissatou.diop@guineesante.gn',
      city: 'Conakry', address: 'Ratoma, Cité Enco-5',
      bio: 'Pédiatre dédiée à la santé des enfants de la naissance à l\'adolescence.',
      rating: 4.9, reviewCount: 203,
      consultationFee: 130000,
      languages: ['Français', 'Anglais'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Ibrahim', lastName: 'Koné',
      specialty: 'Orthopédiste',
      phone: '+224 622 567 890',
      email: 'ibrahim.kone@guineesante.gn',
      city: 'Conakry', address: 'Matam, Rue Patrice Lumumba',
      bio: 'Chirurgien orthopédiste avec 20 ans d\'expérience. Spécialiste des fractures, arthrose et chirurgie du genou.',
      rating: 4.5, reviewCount: 72,
      consultationFee: 180000,
      languages: ['Français'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Mariama', lastName: 'Camara',
      specialty: 'Ophtalmologue',
      phone: '+224 622 678 901',
      email: 'mariama.camara@guineesante.gn',
      city: 'Conakry', address: 'Almamya, Centre-ville',
      bio: 'Ophtalmologue spécialisée dans les troubles visuels, la cataracte et le glaucome.',
      rating: 4.7, reviewCount: 94,
      consultationFee: 110000,
      languages: ['Français', 'Malinké'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Ousmane', lastName: 'Barry',
      specialty: 'Chirurgien-dentiste',
      phone: '+224 622 789 012',
      email: 'ousmane.barry@guineesante.gn',
      city: 'Kankan', address: 'Quartier Commerce, Kankan',
      bio: 'Chirurgien-dentiste avec 10 ans de pratique. Soins dentaires, implants et orthodontie.',
      rating: 4.4, reviewCount: 61,
      consultationFee: 80000,
      languages: ['Français', 'Malinké'],
      isAvailable: true, isVerified: true,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      firstName: 'Kadiatou', lastName: 'Baldé',
      specialty: 'Gynécologue',
      phone: '+224 622 890 123',
      email: 'kadiatou.balde@guineesante.gn',
      city: 'Conakry', address: 'Cosa, Quartier Bambeto',
      bio: 'Gynécologue-obstétricienne. Suivi de grossesse, accouchement et santé de la femme.',
      rating: 4.9, reviewCount: 178,
      consultationFee: 140000,
      languages: ['Français', 'Pular'],
      isAvailable: true, isVerified: true,
    },
  ];

  for (const doctor of doctors) {
    await Doctor.findOneAndUpdate({ email: doctor.email } as any, doctor, { upsert: true, setDefaultsOnInsert: true } as any);
  }
  console.log(`✅ ${doctors.length} médecins upsertés`);

  // ---- Pharmacies ----
  const pharmacies = [
    {
      name: 'Pharmacie Centrale',
      phone: '+224 622 111 222',
      email: 'centrale@pharmacie.gn',
      city: 'Conakry', address: 'Kindia, Avenue de la République',
      isOpen24h: false, openTime: '08:00', closeTime: '22:00',
      rating: 4.7, reviewCount: 145, isVerified: true,
    },
    {
      name: 'Pharmacie du Plateau',
      phone: '+224 622 222 333',
      email: 'plateau@pharmacie.gn',
      city: 'Conakry', address: 'Plateau, Rue du Commerce',
      isOpen24h: true,
      rating: 4.5, reviewCount: 98, isVerified: true,
    },
    {
      name: 'Pharmacie Santé Plus',
      phone: '+224 622 333 444',
      email: 'santeplus@pharmacie.gn',
      city: 'Conakry', address: 'Dixinn, Boulevard Diallo Telli',
      isOpen24h: false, openTime: '09:00', closeTime: '20:00',
      rating: 4.8, reviewCount: 203, isVerified: true,
    },
    {
      name: 'Pharmacie Ratoma',
      phone: '+224 622 444 555',
      city: 'Conakry', address: 'Ratoma, Cité Enco-5',
      isOpen24h: false, openTime: '08:00', closeTime: '21:00',
      rating: 4.6, reviewCount: 112, isVerified: true,
    },
    {
      name: 'Pharmacie Matam Express',
      phone: '+224 622 555 666',
      city: 'Conakry', address: 'Matam, Rue Patrice Lumumba',
      isOpen24h: true,
      rating: 4.4, reviewCount: 67, isVerified: true,
    },
    {
      name: 'Pharmacie Almamya',
      phone: '+224 622 666 777',
      city: 'Conakry', address: 'Almamya, Centre Commercial',
      isOpen24h: false, openTime: '07:30', closeTime: '21:30',
      rating: 4.3, reviewCount: 45, isVerified: true,
    },
    {
      name: 'Pharmacie Kankan Centre',
      phone: '+224 622 777 888',
      city: 'Kankan', address: 'Centre-ville, Kankan',
      isOpen24h: false, openTime: '08:00', closeTime: '20:00',
      rating: 4.2, reviewCount: 38, isVerified: true,
    },
    {
      name: 'Pharmacie Labé Santé',
      phone: '+224 622 888 999',
      city: 'Labé', address: 'Quartier Centre, Labé',
      isOpen24h: false, openTime: '08:00', closeTime: '19:00',
      rating: 4.5, reviewCount: 52, isVerified: true,
    },
  ];

  // Certaines fiches n'ont pas d'email : nom + ville sert alors de clé
  // d'upsert de repli.
  for (const pharmacy of pharmacies) {
    const key = pharmacy.email ? { email: pharmacy.email } : { name: pharmacy.name, city: pharmacy.city };
    await Pharmacy.findOneAndUpdate(key as any, pharmacy, { upsert: true, setDefaultsOnInsert: true } as any);
  }
  console.log(`✅ ${pharmacies.length} pharmacies upsertées`);

  // ---- Laboratoires ----
  const laboratories = [
    {
      name: 'Labo BioSanté',
      phone: '+224 623 100 001', email: 'biosante@labo.gn',
      city: 'Conakry', address: 'Kaloum, Avenue du Commerce',
      analyses: ['Numération formule sanguine', 'Glycémie', 'Bilan lipidique', 'Sérologie paludisme', 'ECBU', 'Bilan hépatique'],
      isOpen24h: false, openTime: '07:00', closeTime: '18:00',
      rating: 4.7, reviewCount: 64, isVerified: true, isAvailable: true,
    },
    {
      name: 'Centre d\'Analyses Moderne',
      phone: '+224 623 100 002', email: 'cam@labo.gn',
      city: 'Conakry', address: 'Ratoma Centre',
      analyses: ['PCR Covid-19', 'Test VIH', 'Sérologie hépatite B/C', 'Bilan rénal', 'Ionogramme', 'Coagulation'],
      isOpen24h: false, openTime: '07:30', closeTime: '17:30',
      rating: 4.5, reviewCount: 41, isVerified: true, isAvailable: true,
    },
    {
      name: 'Laboratoire Conakry Med',
      phone: '+224 623 100 003', email: 'ckrymed@labo.gn',
      city: 'Conakry', address: 'Dixinn, Quartier Landréah',
      analyses: ['Parasitologie', 'Bactériologie', 'Mycologie', 'Virologie', 'Biochimie', 'Hématologie'],
      isOpen24h: false, openTime: '07:00', closeTime: '19:00',
      rating: 4.8, reviewCount: 87, isVerified: true, isAvailable: true,
    },
    {
      name: 'Labo Santé Guinée',
      phone: '+224 623 100 004', email: 'sg@labo.gn',
      city: 'Conakry', address: 'Matam, Rue DI-54',
      analyses: ['Groupage sanguin', 'Bilan thyroïdien', 'PSA', 'Beta HCG', 'Marqueurs tumoraux'],
      isOpen24h: false, openTime: '08:00', closeTime: '17:00',
      rating: 4.4, reviewCount: 33, isVerified: true, isAvailable: true,
    },
    {
      name: 'Labo Donka Analyses',
      phone: '+224 623 100 005', email: 'donka@labo.gn',
      city: 'Conakry', address: 'Face CHU Donka, Dixinn',
      analyses: ['Sérologies infectieuses', 'Biochimie spécialisée', 'Cytologie', 'Anatomopathologie'],
      isOpen24h: true,
      rating: 4.6, reviewCount: 112, isVerified: true, isAvailable: true,
    },
    {
      name: 'Laboratoire Kankan',
      phone: '+224 623 100 006',
      city: 'Kankan', address: 'Centre-ville, Kankan',
      analyses: ['Analyses courantes', 'Sérologies', 'Hématologie', 'Biochimie'],
      isOpen24h: false, openTime: '08:00', closeTime: '17:00',
      rating: 4.3, reviewCount: 28, isVerified: true, isAvailable: true,
    },
  ];

  for (const laboratory of laboratories) {
    const key = laboratory.email ? { email: laboratory.email } : { name: laboratory.name, city: laboratory.city };
    await Laboratory.findOneAndUpdate(key as any, laboratory, { upsert: true, setDefaultsOnInsert: true } as any);
  }
  console.log(`✅ ${laboratories.length} laboratoires upsertés`);

  console.log('\n🎉 Seed terminé avec succès !');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
