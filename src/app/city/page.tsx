'use client';
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import HUD from '@/components/HUD';
import { useStores } from '@/components/useStores';
import { WorldLoadingScreen } from '@/components/WorldLoadingScreen';
import { MobileJoystick } from '@/components/MobileJoystick';

const CityCanvas = dynamic(() => import('@/components/CityCanvas'), {
  ssr: false,
  loading: () => <WorldLoadingScreen isReady={false} />,
});

function Explore() {
  const { stores, layout, loading } = useStores();
  const store = useSearchParams().get('store');
  const [worldReady, setWorldReady] = useState(false);

  return (
    <div
      className="fullscreen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <WorldLoadingScreen isReady={worldReady && !loading} />
      <CityCanvas
        stores={stores}
        layout={layout}
        mode="city"
        onReady={() => setWorldReady(true)}
      />
      {worldReady && <HUD stores={stores} layout={layout} initialStore={store} />}
      {worldReady && <MobileJoystick />}
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
