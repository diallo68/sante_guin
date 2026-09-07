import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import { escapeRegex } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || ''; // 'doctor' | 'pharmacy' | 'laboratory'
  const subStatus = searchParams.get('sub') || '';
  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (subStatus) filter.subscriptionStatus = subStatus;
  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: pattern, $options: 'i' } },
      { lastName: { $regex: pattern, $options: 'i' } },
      { name: { $regex: pattern, $options: 'i' } },
      { specialty: { $regex: pattern, $options: 'i' } },
    ];
  }

  // Avec un type sélectionné, un seul modèle est actif : la pagination se
  // fait directement en base (skip/limit + countDocuments réel). Sans ça,
  // chaque modèle était plafonné à `limit` éléments AVANT la pagination
  // globale, qui re-tranchait ensuite ce lot déjà tronqué — la page 2 et
  // suivantes revenaient toujours vides, quel que soit le nombre réel de
  // résultats en base — voir audit B16.
  if (type === 'doctor' || type === 'pharmacy' || type === 'laboratory') {
    const Model: mongoose.Model<any> = type === 'doctor' ? Doctor : type === 'pharmacy' ? Pharmacy : Laboratory;
    const typeFilter = { ...filter };
    if (search && type !== 'doctor') {
      typeFilter.$or = [{ name: { $regex: escapeRegex(search), $options: 'i' } }] as any;
    }

    const [items, total] = await Promise.all([
      Model.find(typeFilter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Model.countDocuments(typeFilter),
    ]);

    return NextResponse.json({
      items: items.map((d: any) => ({ ...d, _type: type })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  }

  // Sans type : vue combinée des trois collections, bornée et paginée en
  // mémoire (volume raisonnable pour un back-office admin).
  const results: unknown[] = [];

  const doctors = await Doctor.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  doctors.forEach(d => results.push({ ...d, _type: 'doctor' }));

  const phFilter = { ...filter };
  if (search) phFilter.$or = [{ name: { $regex: escapeRegex(search), $options: 'i' } }] as any;
  const pharmacies = await Pharmacy.find(phFilter).sort({ createdAt: -1 }).limit(50).lean();
  pharmacies.forEach(p => results.push({ ...p, _type: 'pharmacy' }));

  const labFilter = { ...filter };
  if (search) labFilter.$or = [{ name: { $regex: escapeRegex(search), $options: 'i' } }] as any;
  const laboratories = await Laboratory.find(labFilter).sort({ createdAt: -1 }).limit(50).lean();
  laboratories.forEach(l => results.push({ ...l, _type: 'laboratory' }));

  results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = results.length;
  const paginated = results.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    items: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
