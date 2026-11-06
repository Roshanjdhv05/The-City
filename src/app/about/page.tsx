import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
export default function About() {
  return (
    <div className="page light"><Nav />
      <div className="wrap narrow-text">
        <span className="eyebrow" style={{ color: '#0e7490' }}>About</span>
        <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)' }}>A place for businesses to be found.</h1>
        <p>THE CITY is a virtual business marketplace. Instead of a flat directory, every business gets a plot on a shared map and a storefront that visitors can walk up to, look inside, and visit.</p>
        <p>Owners claim a plot, choose a building template or assemble one from modular pieces, add their name, tagline, logo and website, and publish. Visitors explore in first or third person, search for businesses, and open a store’s website only when they choose to.</p>
        <p>The city grows as demand does: administrators can add new districts, roads and plots, and they appear in the same world everyone explores.</p>
        <div style={{ display: 'flex', gap: '.8rem', marginTop: '1.6rem', flexWrap: 'wrap' }}><Link className="btn" href="/city">Explore the City</Link><Link className="btn outline" style={{ color: '#0b1b33', borderColor: '#b7c6dd' }} href="/buy">Claim Your Plot</Link></div>
      </div>
      <Footer />
    </div>
  );
}
