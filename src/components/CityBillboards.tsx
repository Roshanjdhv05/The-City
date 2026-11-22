'use client';
import { useEffect } from 'react';
import { useBillboardStore } from '@/lib/billboards';
import { BillboardMesh } from './BillboardMesh';

/**
 * CityBillboards — renders all 30 physical advertising billboards across the
 * virtual city markets.  Data is loaded from LocalStorage / Supabase via the
 * billboard store; updates made in the Admin Dashboard reflect in real-time.
 */
export function CityBillboards() {
  const { billboards, initialized, init } = useBillboardStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) return null;

  return (
    <group name="city-billboards">
      {billboards.map((bb) => (
        <BillboardMesh key={bb.id} bb={bb} />
      ))}
    </group>
  );
}
