'use client';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useStores } from '@/components/useStores';
import { useAuth } from '@/lib/data';

export default function Dashboard() {
  const { user, ready } = useAuth(), { stores } = useStores(), mine = stores.filter(s => s.ownerId === user?.id);
  const visits = mine.reduce((a, s) => a + s.visits, 0), clicks = mine.reduce((a, s) => a + s.clicks, 0);
  return (
    <div className="page light"><Nav />
      <div className="wrap">
        <h1>Owner Dashboard</h1>
        {!ready ? null : !user ? <p><Link href="/login">Sign in</Link> to see your stores.</p> : <>
          <div className="stats">
            <div><span>Owned plots</span><b>{mine.length}</b><Link href="/buy">Buy more</Link></div>
            <div><span>Store status</span><b className="ok">{mine.length ? 'Active' : 'None'}</b></div>
            <div><span>Website visits</span><b>{visits.toLocaleString()}</b></div>
            <div><span>Outbound clicks</span><b>{clicks.toLocaleString()}</b></div>
          </div>
          <h2>Your stores</h2>
          {mine.length ? <ul className="list">{mine.map(s => <li key={s.plotId}><b>{s.config.name}</b><span>{s.plotId}</span><Link className="btn sm" href={'/editor?plot=' + s.plotId}>Edit store</Link></li>)}</ul> : <p>You don’t own a plot yet. <Link href="/buy">Find one</Link>.</p>}
        </>}
      </div>
      <Footer />
    </div>
  );
}
