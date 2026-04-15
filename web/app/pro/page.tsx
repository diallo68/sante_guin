'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pro/dashboard');
  }, [router]);

  return null;
}
