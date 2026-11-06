import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div><Link href="/" className="brand" style={{ color: '#fff' }}><span>THE <b>CITY</b></span></Link><p>A virtual marketplace where businesses claim a plot, build a storefront and get discovered.</p></div>
        <div><h4>Explore</h4><ul><li><Link href="/city">Explore the City</Link></li><li><Link href="/buy">Plot marketplace</Link></li><li><Link href="/city?store=J01">J Enterprise</Link></li></ul></div>
        <div><h4>Company</h4><ul><li><Link href="/about">About</Link></li><li><Link href="/faq">FAQs</Link></li><li><Link href="/dashboard">Owner dashboard</Link></li></ul></div>
        <div><h4>Legal &amp; help</h4><ul><li><Link href="/terms">Terms</Link></li><li><Link href="/contact">Contact</Link></li></ul></div>
        <div className="legal"><span>© {new Date().getFullYear()} THE CITY. All rights reserved.</span><span>Built with Next.js &amp; React Three Fiber</span></div>
      </div>
    </footer>
  );
}
