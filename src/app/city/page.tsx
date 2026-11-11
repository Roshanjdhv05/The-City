'use client';
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import HUD from '@/components/HUD';
import { useStores } from '@/components/useStores';
import { WorldLoadingScreen } from '@/components/WorldLoadingScreen';
import { MobileRotateInstruction } from '@/components/MobileRotateInstruction';
import { MobileJoystick } from '@/components/MobileJoystick';

const CityCanvas = dynamic(() => import('@/components/CityCanvas'), {
  ssr: false,
  loading: () => <WorldLoadingScreen isReady={false} />,
});

function Explore() {
  const { stores, layout, loading } = useStores();
  const store = useSearchParams().get('store');
  const [worldReady, setWorldReady] = useState(false);

  // ONLY mark ready when 3D building assets and GPU frame rendering are confirmed
  const handleWorldReady = () => {
    setWorldReady(true);
  };

  return (
    <div className="fullscreen">
      <MobileRotateInstruction />
      <WorldLoadingScreen isReady={worldReady && !loading} />
      <CityCanvas
        stores={stores}
        layout={layout}
        mode="city"
        onReady={handleWorldReady}
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
