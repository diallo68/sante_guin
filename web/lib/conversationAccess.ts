import Doctor from '@/models/Doctor';

// Vérifie qu'un utilisateur authentifié a accès à une conversation donnée.
// Partagé entre la lecture/écriture de messages, l'upload de pièces jointes
// et leur téléchargement, pour éviter que la logique d'accès ne diverge
// entre plusieurs copies (voir audit S05).
export async function checkConversationAccess(
  conv: { type: string; participants?: any[]; patientId?: any; doctorId?: any },
  authUser: { userId: string; role: string }
): Promise<boolean> {
  if (conv.type === 'document') {
    return (conv.participants || []).some((p: any) => String(p.userId) === authUser.userId);
  }
  const isPatient = String(conv.patientId?._id ?? conv.patientId) === authUser.userId;
  if (isPatient) return true;
  if (authUser.role === 'doctor' || authUser.role === 'pharmacist' || authUser.role === 'laboratorist') {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    return doc ? String(doc._id) === String(conv.doctorId?._id ?? conv.doctorId) : false;
  }
  return false;
}
