'use client';
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import HUD from '@/components/HUD';
import { useStores } from '@/components/useStores';
import { WorldLoadingScreen } from '@/components/WorldLoadingScreen';

const CityCanvas = dynamic(() => import('@/components/CityCanvas'), {
  ssr: false,
  loading: () => <WorldLoadingScreen isReady={false} />,
});

function Explore() {
  const { stores, layout, loading } = useStores();
  const store = useSearchParams().get('store');
  const [worldReady, setWorldReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Ensure WebGL assets, shaders and initial frame have prepared
      const t = setTimeout(() => setWorldReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [loading]);

  return (
    <div className="fullscreen">
      <WorldLoadingScreen isReady={worldReady} />
      <CityCanvas
        stores={stores}
        layout={layout}
        mode="city"
        onReady={() => setWorldReady(true)}
      />
      <HUD stores={stores} layout={layout} initialStore={store} />
    </div>
  );
}

export default function City() {
  return (
    <Suspense fallback={<WorldLoadingScreen isReady={false} />}>
      <Explore />
    </Suspense>
  );
}
