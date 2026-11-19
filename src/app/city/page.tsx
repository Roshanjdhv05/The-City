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

  useEffect(() => {
    // Try to lock orientation to landscape on mobile browsers that support it
    const lock = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch {
        // lock not supported (desktop/iOS) — ignore silently
      }
    };
    lock();
  }, []);

  return (
    <div className="fullscreen">
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
