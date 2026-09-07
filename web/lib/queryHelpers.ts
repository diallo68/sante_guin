// Utilitaires partagés pour les routes de liste/recherche — voir audit S17.

// Échappe les caractères spéciaux d'une regex avant de l'utiliser dans une
// recherche `$regex` MongoDB. Sans ça, une entrée comme `(a+)+$` peut coûter
// cher à évaluer, et le motif brut du client contrôle entièrement la
// requête plutôt qu'une simple recherche de sous-chaîne.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

// Borne page/limit à des valeurs sûres. `limit=0` est un cas piège : pour
// MongoDB, `.limit(0)` signifie « aucune limite » et renvoyait donc la
// collection entière avant ce correctif.
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 12, maxLimit = 50 }: { defaultLimit?: number; maxLimit?: number } = {}
): Pagination {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(maxLimit, rawLimit)
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}
