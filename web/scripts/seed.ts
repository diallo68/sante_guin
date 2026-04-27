import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant dans .env.local');
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

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
  const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', PharmacySchema);

  // Nettoyer les collections
  await Doctor.deleteMany({});
  await Pharmacy.deleteMany({});
  console.log('🗑️  Collections doctors et pharmacies nettoyées');

  // Créer un compte médecin de test
  const passwordHash = await bcrypt.hash('medecin123', 12);
  let doctorUser = await User.findOne({ email: 'docteur@guineesante.gn' });
  if (!doctorUser) {
    doctorUser = await User.create({
      firstName: 'Ahmed', lastName: 'Diallo',
      email: 'docteur@guineesante.gn',
      passwordHash, role: 'doctor', isVerified: true,
    });
    console.log('👨‍⚕️  Compte médecin créé : docteur@guineesante.gn / medecin123');
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

  await Doctor.insertMany(doctors);
  console.log(`✅ ${doctors.length} médecins ajoutés`);

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

  await Pharmacy.insertMany(pharmacies);
  console.log(`✅ ${pharmacies.length} pharmacies ajoutées`);

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('─────────────────────────────────');
  console.log('Comptes de test créés :');
  console.log('  Patient  : test@guineesante.gn / motdepasse123');
  console.log('  Médecin  : docteur@guineesante.gn / medecin123');
  console.log('─────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
