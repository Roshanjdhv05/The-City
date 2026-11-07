'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import HUD from '@/components/HUD';
import { useStores } from '@/components/useStores';
const CityCanvas = dynamic(() => import('@/components/CityCanvas'), { ssr: false, loading: () => <div className="loading">Loading the city…</div> });

function Explore() {
  const { stores, layout } = useStores(), store = useSearchParams().get('store');
  return (
    <div className="fullscreen">
      <CityCanvas stores={stores} layout={layout} mode="city" />
      <HUD stores={stores} layout={layout} initialStore={store} />
    </div>
  );
}
export default function City() { return <Suspense fallback={<div className="loading">Loading the city…</div>}><Explore /></Suspense>; }
