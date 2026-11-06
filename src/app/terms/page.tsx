import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
export const metadata = { title: 'Terms – THE CITY' };
export default function Terms() {
  return (
    <div className="page light"><Nav />
      <div className="wrap narrow-text legal-doc">
        <span className="eyebrow" style={{ color: '#0e7490' }}>Legal</span><h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Terms of use</h1>
        <p><b>Template notice:</b> these terms are a starting point and must be reviewed by a qualified lawyer, and completed with your company details, before you launch publicly.</p>
        <h2>1. The service</h2><p>THE CITY provides a virtual environment in which businesses can claim plots, build storefronts and be discovered by visitors. Features may change as the service develops.</p>
        <h2>2. Accounts</h2><p>You are responsible for your account credentials and for activity under your account. Provide accurate information and keep it up to date.</p>
        <h2>3. Plots and storefronts</h2><p>A plot gives you the right to display one storefront within the rules of the city. Reserved plots cannot be claimed. The operator may reclaim plots that are abandoned or used in breach of these terms.</p>
        <h2>4. Content</h2><p>You may only upload logos, names, taglines and links you have the right to use. Content must not be unlawful, misleading, infringing or harmful. External links open only when a visitor chooses to follow them; you are responsible for the sites you link to.</p>
        <h2>5. Fees</h2><p>Plot prices are shown in the marketplace. Where fees apply they are billed as described at purchase. Payment processing is not enabled in every deployment.</p>
        <h2>6. Availability and liability</h2><p>The service is provided “as is”. To the extent permitted by law the operator is not liable for indirect or consequential loss arising from its use.</p>
        <h2>7. Contact</h2><p>Questions about these terms: see the <a href="/contact">contact page</a>.</p>
      </div>
      <Footer />
    </div>
  );
}
