'use client';
import { useCallback, useEffect, useState } from 'react';
import { loadWorld, SEED_STORES } from '@/lib/data';
import { baseLayout, Layout } from '@/lib/layout';
import type { Store } from '@/lib/types';

const initialLayout = baseLayout();
/** One hook for the shared world: stores + city layout, used by the 3D scene, buy page and /admin. */
export function useStores() {
  const [stores, setStores] = useState<Store[]>(SEED_STORES), [layout, setLayout] = useState<Layout>(initialLayout), [loading, setLoading] = useState(true);
  const reload = useCallback(() => loadWorld().then(w => { setStores(w.stores); setLayout(w.layout); }).catch(() => {}).finally(() => setLoading(false)), []);
  useEffect(() => { reload(); }, [reload]);
  return { stores, layout, reload, loading };
}
